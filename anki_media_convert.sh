cd "$ANKI_MEDIA"
for file in larsthebot*.mp3
do
    # mv -- "$file" "${file//_/-}"
    filename=${file%.*}
    # ffmpeg -i $filename{.oga,.mp3} -y
    mv $file $filename=.mp3
    # git archive -o ~/slett/$(basename $D).zip HEAD
done
