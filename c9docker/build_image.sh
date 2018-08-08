if [ -a files.tar ]; then
    rm files.tar
fi

cd files
tar cf ../files.tar *
cd ..

docker build . -t idec/idec:latest --no-cache

rm files.tar
