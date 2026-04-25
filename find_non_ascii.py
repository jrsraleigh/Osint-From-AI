
import sys

with open('src/sites.ts', 'rb') as f:
    content = f.read()

for i, byte in enumerate(content):
    if byte > 127:
        # Found a non-ASCII character
        # Get local context
        start = max(0, i - 20)
        end = min(len(content), i + 20)
        context = content[start:end]
        print(f"Non-ASCII byte {byte} at position {i}: {context}")
        break
else:
    print("No non-ASCII characters found.")
