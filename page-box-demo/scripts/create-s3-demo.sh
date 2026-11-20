#!/bin/bash
# Create improved S3 demo video with better zoom and timing
# This script re-processes the S3 recordings with:
# - Better zoom targets (zoom to input field when pasting, zoom to results when showing analysis)
# - Slower transitions on important parts
# - Clearer visibility of prompts being typed/pasted

set -e

cd "$(dirname "$0")/.."

INPUT1="videos/S3-pt1.mov"
INPUT2="videos/S3-pt2.mov"
OUTPUT="videos/S3-Improved.mov"
TEMP_DIR="videos/temp_s3"

mkdir -p "$TEMP_DIR"

echo "Creating improved S3 demo video..."

# Source video is 3360x2100 at 60fps
# Output will be 3360x2100 at 60fps (same as source for smooth playback)

# ==============================================================================
# SEGMENT 1: Overview of Page 3 (0-5s) - Full view, no zoom
# ==============================================================================
echo "Segment 1: Overview (0-5s)..."
ffmpeg -y -i "$INPUT1" \
  -ss 0 -t 5 \
  -vf "scale=3360:2100" \
  -c:v libx264 -preset slow -crf 18 -r 60 \
  "$TEMP_DIR/seg01.mp4" 2>/dev/null

# ==============================================================================
# SEGMENT 2: Zoom to chat input - showing prompt being typed/pasted (5-15s)
# Zoom to the text input area (bottom of screen, centered)
# ==============================================================================
echo "Segment 2: Zoom to input field (5-15s)..."
ffmpeg -y -i "$INPUT1" \
  -ss 5 -t 10 \
  -vf "zoompan=z='1.8':x='iw/2-iw/zoom/2':y='ih*0.85-ih/zoom/2':d=600:s=3360x2100:fps=60" \
  -c:v libx264 -preset slow -crf 18 \
  "$TEMP_DIR/seg02.mp4" 2>/dev/null

# ==============================================================================
# SEGMENT 3: Zoom out to see AI response appear (15-25s)
# ==============================================================================
echo "Segment 3: Zoom out to see response (15-25s)..."
ffmpeg -y -i "$INPUT1" \
  -ss 15 -t 10 \
  -vf "zoompan=z='min(zoom+0.001,1.5)':x='iw/2-iw/zoom/2':y='ih*0.6-ih/zoom/2':d=600:s=3360x2100:fps=60" \
  -c:v libx264 -preset slow -crf 18 \
  "$TEMP_DIR/seg03.mp4" 2>/dev/null

# ==============================================================================
# SEGMENT 4: Zoom to AI analysis result (25-45s) - SLOW zoom for readability
# Focus on the analysis text area
# ==============================================================================
echo "Segment 4: Zoom to analysis result - SLOW (25-45s)..."
ffmpeg -y -i "$INPUT1" \
  -ss 25 -t 20 \
  -vf "zoompan=z='min(zoom+0.0005,1.8)':x='iw/2-iw/zoom/2':y='ih*0.4-ih/zoom/2':d=1200:s=3360x2100:fps=60" \
  -c:v libx264 -preset slow -crf 18 \
  "$TEMP_DIR/seg04.mp4" 2>/dev/null

# ==============================================================================
# SEGMENT 5: Second prompt - Page 3: 4-6 (45-55s)
# Zoom to input field again
# ==============================================================================
echo "Segment 5: Second prompt input (45-55s)..."
ffmpeg -y -i "$INPUT1" \
  -ss 45 -t 10 \
  -vf "zoompan=z='1.8':x='iw/2-iw/zoom/2':y='ih*0.85-ih/zoom/2':d=600:s=3360x2100:fps=60" \
  -c:v libx264 -preset slow -crf 18 \
  "$TEMP_DIR/seg05.mp4" 2>/dev/null

# ==============================================================================
# SEGMENT 6: Second analysis result (0-30s from Part2)
# Zoom to the analysis text area
# ==============================================================================
echo "Segment 6: Second analysis result (0-30s)..."
ffmpeg -y -i "$INPUT2" \
  -ss 0 -t 30 \
  -vf "zoompan=z='min(zoom+0.0005,1.8)':x='iw/2-iw/zoom/2':y='ih*0.4-ih/zoom/2':d=1800:s=3360x2100:fps=60" \
  -c:v libx264 -preset slow -crf 18 \
  "$TEMP_DIR/seg06.mp4" 2>/dev/null

# ==============================================================================
# SEGMENT 7: Third prompt - Page 3: 7-10 (30-45s from Part2)
# Zoom to input field
# ==============================================================================
echo "Segment 7: Third prompt input (30-45s)..."
ffmpeg -y -i "$INPUT2" \
  -ss 30 -t 15 \
  -vf "zoompan=z='1.8':x='iw/2-iw/zoom/2':y='ih*0.85-ih/zoom/2':d=900:s=3360x2100:fps=60" \
  -c:v libx264 -preset slow -crf 18 \
  "$TEMP_DIR/seg07.mp4" 2>/dev/null

# ==============================================================================
# SEGMENT 8: Third analysis result (45-60s from Part2)
# Final analysis with slow zoom
# ==============================================================================
echo "Segment 8: Third analysis result (45-60s)..."
ffmpeg -y -i "$INPUT2" \
  -ss 45 -t 15 \
  -vf "zoompan=z='min(zoom+0.0005,1.8)':x='iw/2-iw/zoom/2':y='ih*0.4-ih/zoom/2':d=900:s=3360x2100:fps=60" \
  -c:v libx264 -preset slow -crf 18 \
  "$TEMP_DIR/seg08.mp4" 2>/dev/null

# ==============================================================================
# CONCATENATE ALL SEGMENTS
# ==============================================================================
echo "Concatenating segments..."
cat > "$TEMP_DIR/concat.txt" << EOF
file 'seg01.mp4'
file 'seg02.mp4'
file 'seg03.mp4'
file 'seg04.mp4'
file 'seg05.mp4'
file 'seg06.mp4'
file 'seg07.mp4'
file 'seg08.mp4'
EOF

ffmpeg -y -f concat -safe 0 -i "$TEMP_DIR/concat.txt" \
  -c copy \
  "$OUTPUT" 2>/dev/null

# Get final duration
DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUTPUT")
echo ""
echo "✅ Created: $OUTPUT"
echo "   Duration: ${DURATION}s"
echo "   Resolution: 3360x2100"
echo ""
echo "Improvements:"
echo "  • Better zoom targets (input field, AI responses)"
echo "  • Slower transitions on important parts"
echo "  • Clearer visibility of prompts being pasted"

# Cleanup
rm -rf "$TEMP_DIR"
