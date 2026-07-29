import argparse
import os
import subprocess

def main():
    parser = argparse.ArgumentParser(description="Duix-Avatar Lip Sync Mock")
    parser.add_index = parser.add_argument
    parser.add_argument("--avatar", required=True, help="Path to avatar template video or image")
    parser.add_argument("--audio", required=True, help="Path to narration audio file")
    parser.add_argument("--output", required=True, help="Path to output synced video file")
    args = parser.parse_args()

    print(f"Loading Duix-Avatar model... (Mock)")
    print(f"Reading voice audio from: {args.audio}")
    print(f"Applying lip-sync alignment with avatar template: {args.avatar}")

    # Generate lip-sync output using ffmpeg by stitching the audio onto the video
    # If the avatar is an image, loop it. If it's a video, map it.
    if args.avatar.endswith(('.png', '.jpg', '.jpeg')):
        cmd = f'ffmpeg -y -loop 1 -i "{args.avatar}" -i "{args.audio}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "{args.output}"'
    else:
        # Loop the video template to match the audio duration
        cmd = f'ffmpeg -y -stream_loop -1 -i "{args.avatar}" -i "{args.audio}" -c:v libx264 -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "{args.output}"'

    print(f"Running command: {cmd}")
    os.system(cmd)
    print("Lip sync completed.")

if __name__ == "__main__":
    main()
