from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

model = SentenceTransformer(
    'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'
)

def similarity(word1, word2):

    emb1 = model.encode([word1])
    emb2 = model.encode([word2])

    sim = cosine_similarity(emb1, emb2)[0][0]

    return float(sim)