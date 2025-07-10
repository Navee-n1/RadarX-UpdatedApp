import logging
import os
 
# Create logs folder if it doesn't exist
LOG_DIR = os.path.join(os.path.dirname(__file__), "..", "logs")
os.makedirs(LOG_DIR, exist_ok=True)
 
# Create logger
logger = logging.getLogger("RadarXLogger")
logger.setLevel(logging.DEBUG)  # You can change to INFO in production
 
# Formatter
formatter = logging.Formatter('[%(asctime)s] %(levelname)s: %(message)s', "%Y-%m-%d %H:%M:%S")
 
# File handler
file_handler = logging.FileHandler(os.path.join(LOG_DIR, "app.log"))
file_handler.setFormatter(formatter)
file_handler.setLevel(logging.DEBUG)
 
# Console handler
console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)
console_handler.setLevel(logging.INFO)
 
# Add handlers only once
if not logger.hasHandlers():
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)