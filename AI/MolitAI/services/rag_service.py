import os
import re
import time
import pandas as pd
import numpy as np
import faiss
import pickle
import httpx
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
from rank_bm25 import BM25Okapi
from dotenv import load_dotenv

load_dotenv()

class LegalRAGService:
    def __init__(self, base_dir: str):
        self.base_dir = base_dir
        self.data_dir = os.path.join(base_dir, "data")
        self.index_dir = os.path.join(base_dir, "models", "index")
        
        # Create directories if they don't exist
        os.makedirs(self.data_dir, exist_ok=True)
        os.makedirs(self.index_dir, exist_ok=True)
        
        self.index_path = os.path.join(self.index_dir, "faiss.index")
        self.chunks_path = os.path.join(self.index_dir, "chunks.pkl")
        
        self.all_chunks = []
        self.bm25 = None
        self.index = None
        self.embedding_model = None
        
        base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.ollama_url = f"{base_url}/api/generate"
        self.model_name = os.getenv("AI_MODEL_NAME", "qwen2.5:3b")

    def initialize(self):
        print("Initializing Embedding Model...")
        self.embedding_model = SentenceTransformer("intfloat/multilingual-e5-small")
        
        if os.path.exists(self.index_path) and os.path.exists(self.chunks_path):
            print("Loading existing FAISS index and chunks...")
            self.index = faiss.read_index(self.index_path)
            with open(self.chunks_path, "rb") as f:
                self.all_chunks = pickle.load(f)
            
            # Rebuild BM25 from chunks
            tokenized_corpus = [self._simple_tokenize(c["title"] + " " + c["text"]) for c in self.all_chunks]
            self.bm25 = BM25Okapi(tokenized_corpus)
            print(f"Loaded {len(self.all_chunks)} chunks.")
        else:
            print("No existing index found. Building from data directory...")
            self._build_index()

    def _load_law_pdf(self, path, source_name):
        reader = PdfReader(path)
        full_text = ""

        for page in reader.pages:
            text = page.extract_text()
            if text:
                full_text += text + "\n"

        pattern = r"(제\d+조(?:의\d+)?\([^)]+\))"
        splits = re.split(pattern, full_text)

        chunks = []

        for i in range(1, len(splits), 2):
            title = splits[i].strip()
            body = splits[i + 1].strip() if i + 1 < len(splits) else ""

            if body:
                chunks.append({
                    "source": source_name,
                    "title": title,
                    "text": title + "\n" + body
                })

        if len(chunks) == 0 and full_text.strip():
            size = 800
            overlap = 150
            start = 0
            chunk_id = 1

            while start < len(full_text):
                part = full_text[start:start + size].strip()

                if part:
                    chunks.append({
                        "source": source_name,
                        "title": f"문서조각-{chunk_id}",
                        "text": part
                    })

                start += size - overlap
                chunk_id += 1

        return chunks

    def _load_glossary_csv(self, path, source_name):
        encodings = ["utf-8-sig", "utf-8", "cp949", "euc-kr"]
        df = None

        for enc in encodings:
            try:
                df = pd.read_csv(path, encoding=enc)
                break
            except:
                pass

        if df is None:
            print(f"Failed to load CSV: {path}")
            return []

        chunks = []
        for _, row in df.iterrows():
            term = str(row.get("용어", "")).strip()
            desc = str(row.get("용어설명", "")).strip()

            if term and desc:
                chunks.append({
                    "source": source_name,
                    "title": term,
                    "text": f"용어: {term}\n설명: {desc}"
                })

        return chunks

    def _build_index(self):
        self.all_chunks = []
        files = os.listdir(self.data_dir)
        
        for file in files:
            path = os.path.join(self.data_dir, file)
            if file.lower().endswith(".pdf"):
                self.all_chunks.extend(self._load_law_pdf(path, file))
            elif file.lower().endswith(".csv"):
                self.all_chunks.extend(self._load_glossary_csv(path, file))

        print(f"Total chunks loaded: {len(self.all_chunks)}")
        
        if len(self.all_chunks) == 0:
            print("No data available to index. Returning empty index.")
            dimension = 384 # default for e5-small
            self.index = faiss.IndexFlatIP(dimension)
            self.bm25 = None
            return

        texts = [f"passage: {c['title']}\n{c['text']}" for c in self.all_chunks]
        embeddings = self.embedding_model.encode(texts, normalize_embeddings=True)
        embeddings = np.array(embeddings).astype("float32")

        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dimension)
        self.index.add(embeddings)

        tokenized_corpus = [self._simple_tokenize(c["title"] + " " + c["text"]) for c in self.all_chunks]
        self.bm25 = BM25Okapi(tokenized_corpus)
        
        # Save persistence files
        faiss.write_index(self.index, self.index_path)
        with open(self.chunks_path, "wb") as f:
            pickle.dump(self.all_chunks, f)

    def _simple_tokenize(self, text):
        text = re.sub(r"[^가-힣a-zA-Z0-9\s]", " ", text)
        return text.split()

    def _normalize_query(self, query):
        query = query.strip()
        remove_words = ["뭐야", "뭔가요", "무엇인가요", "알려줘", "설명해줘", "어떻게", "하나요", "해?", "있나?", "있어?", "좀", "제발", "?", "!"]
        for word in remove_words:
            query = query.replace(word, " ")
        query = re.sub(r"\s+", " ", query).strip()
        return query

    def _minmax_normalize(self, scores):
        scores = np.array(scores, dtype=np.float32)
        if len(scores) == 0:
            return scores
        min_s = scores.min()
        max_s = scores.max()
        if max_s - min_s < 1e-8:
            return np.ones_like(scores)
        return (scores - min_s) / (max_s - min_s)

    def search_docs(self, query, top_k=3, candidate_k=30, min_score=0.10):
        if not self.bm25 or not self.index or len(self.all_chunks) == 0:
            return []

        normalized_query = self._normalize_query(query)
        if normalized_query == "":
            normalized_query = query

        tokenized_query = self._simple_tokenize(normalized_query)

        # BM25
        bm25_scores = self.bm25.get_scores(tokenized_query)
        bm25_top_indices = np.argsort(bm25_scores)[::-1][:candidate_k]
        bm25_top_scores = bm25_scores[bm25_top_indices]
        bm25_norm_scores = self._minmax_normalize(bm25_top_scores)

        # FAISS
        query_embedding = self.embedding_model.encode([f"query: {normalized_query}"], normalize_embeddings=True)
        query_embedding = np.array(query_embedding).astype("float32")

        faiss_scores, faiss_indices = self.index.search(query_embedding, candidate_k)
        faiss_indices = faiss_indices[0]
        faiss_scores = faiss_scores[0]
        faiss_norm_scores = self._minmax_normalize(faiss_scores)

        merged = {}

        for idx, score in zip(bm25_top_indices, bm25_norm_scores):
            merged[int(idx)] = merged.get(int(idx), 0) + float(score) * 0.40

        for idx, score in zip(faiss_indices, faiss_norm_scores):
            merged[int(idx)] = merged.get(int(idx), 0) + float(score) * 0.60

        # overlap 보정
        query_tokens = set(tokenized_query)
        for idx in list(merged.keys()):
            chunk = self.all_chunks[idx]
            text_for_check = chunk["title"] + " " + chunk["text"]
            overlap = sum(1 for token in query_tokens if token and token in text_for_check)
            if overlap > 0:
                merged[idx] += min(0.20, overlap * 0.05)

        # 법률 원문 우선 보정
        for idx in list(merged.keys()):
            chunk = self.all_chunks[idx]
            if "법률" in chunk["source"]:
                merged[idx] += 0.15
            if chunk["title"].startswith("제"):
                merged[idx] += 0.10

        ranked = sorted(merged.items(), key=lambda x: x[1], reverse=True)
        if len(ranked) == 0:
            return []

        top_score = ranked[0][1]
        results = []
        seen = set()

        for idx, final_score in ranked:
            if final_score < top_score * 0.60 or final_score < min_score:
                continue

            chunk = self.all_chunks[idx]
            key = (chunk["source"], chunk["title"])
            if key in seen:
                continue
            seen.add(key)

            text = chunk["text"]
            if len(text) > 900:
                text = text[:900]

            results.append({
                "score": round(float(final_score), 4),
                "source": chunk["source"],
                "title": chunk["title"],
                "text": text
            })

            if len(results) >= top_k:
                break

        return results

    async def ask(self, query: str, top_k: int = 3):
        search_start = time.time()
        docs = self.search_docs(query, top_k=top_k)
        search_time = time.time() - search_start

        if len(docs) == 0:
            no_result = "관련 법령 또는 참고자료를 찾지 못했습니다.\n질문을 더 구체적으로 입력해주세요."
            return {"answer": no_result, "references": []}

        context = "\n\n".join([f"[출처]\n{d['source']}\n[항목]\n{d['title']}\n[내용]\n{d['text']}" for d in docs])

        prompt = f"""
너는 집현전 v2의 부동산 법률 RAG 챗봇이다.

역할:
사용자의 질문에 대해 참고자료를 근거로 쉽게 답변한다.

규칙:
1. 반드시 참고자료에 있는 내용만 근거로 답변한다.
2. 참고자료에 없는 내용은 만들지 않는다.
3. 숫자, 기간, 금액은 참고자료에 나온 그대로 사용한다.
4. 답변은 한국어로 작성한다.
5. 답변은 1~2문장으로 짧게 작성한다.
6. 질문과 직접 관련 있는 참고자료만 사용한다.
7. 마지막에 근거 항목명을 괄호로 붙인다.
8. 참고자료에 질문과 관련된 조항이 있으면 반드시 그 조항을 근거로 답한다.
9. 정말 관련 조항이 하나도 없을 때만 "제공된 자료만으로는 확인하기 어렵습니다."라고 답한다.

[참고자료]
{context}

[질문]
{query}

[답변]
"""
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    self.ollama_url,
                    json={
                        "model": self.model_name,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.0,
                            "top_p": 0.3,
                            "top_k": 10
                        }
                    }
                )
                response.raise_for_status()
                raw_answer = response.json().get("response", "")
                
                answer = self._clean_answer(raw_answer)
                if not answer:
                    answer = "제공된 자료만으로는 확인하기 어렵습니다."
                    
        except Exception as e:
            answer = f"오류 발생: LLM 서비스와 통신할 수 없습니다. ({str(e)})"

        return {
            "answer": answer,
            "references": docs
        }

    def _clean_answer(self, text):
        if not text:
            return ""
        cleaned = text.strip()
        cleaned = cleaned.replace("mean", "").replace("Mean", "")
        remove_patterns = ["참고자료에 따르면", "의 내용에 따르면", "설명하면", "다음과 같습니다"]
        for p in remove_patterns:
            cleaned = cleaned.replace(p, "")
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        return cleaned
