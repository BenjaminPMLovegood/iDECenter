if [[ -a files.tar ]]; then
    rm files.tar
fi

# load root password, username & user password in docker
if [[ ! -a rootpasswd.shadow ]]; then
    read -p "enter root password for docker image:" rootpasswd
    echo "root:$rootpasswd" > rootpasswd.shadow
fi

if [[ ! -a username.shadow ]]; then
    read -p "enter username for docker image:" username
    echo "$username" > username.shadow
fi

if [[ ! -a userpasswd.shadow ]]; then
    read -p "enter user password for docker image:" userpasswd
    echo "$userpasswd" > userpasswd.shadow
fi

cp rootpasswd.shadow files/rootpasswd
cp username.shadow files/username
cp userpasswd.shadow files/userpasswd

cd files
chmod +x *.sh
tar cf ../files.tar *
rm rootpasswd username userpasswd
cd ..

docker build . -t idec/idec:latest --no-cache

rm files.tar
