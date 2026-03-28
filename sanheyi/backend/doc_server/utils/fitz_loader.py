
try:
    import fitz
except ImportError:
    fitz = None

def is_fitz_available():
    return fitz is not None
