PASS="username:password"

if [ -a /root/c9auth/password ]; then
    echo "password found. load it."
    read PASS < /root/c9auth/password
fi

node /root/c9/server.js --listen 0.0.0.0 --port 8080 -a $PASS -w /root/workspace
