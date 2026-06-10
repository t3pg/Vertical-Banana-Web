from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ai import similarity

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/similarity")
def get_similarity(a: str, b: str):

    sim = similarity(a, b)

    return {
        "similarity": sim
    }