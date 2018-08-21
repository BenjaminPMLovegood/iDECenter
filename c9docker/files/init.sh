echo "loading root password..."
chpasswd < /root/rootpasswd
rm /root/rootpasswd

echo -e "LANG=\"en_US.UTF-8\"" > /etc/default/local

echo "adding user..."
read username < /root/username
read userpasswd < /root/userpasswd
userdir="/home/$username"
rm /root/username /root/userpasswd
echo "user is ($username:$userpasswd)"
mkdir $userdir
useradd -d $userdir $username
echo "$username:$userpasswd" | chpasswd
chown $username $userdir

echo "installing essential packages..."
apt-get update
apt-get upgrade -y

apt-get install -y apt-utils
apt-get install -y sudo nodejs npm git g++ curl tmux 

echo "writing entry script..."
echo "PASS=\"username:password\""                > /root/start.sh
echo "if [ -a /root/c9auth/password ]; then"    >> /root/start.sh
echo "    echo \"password found. load it.\""    >> /root/start.sh
echo "    read PASS < /root/c9auth/password"    >> /root/start.sh
echo "fi"                                       >> /root/start.sh
echo "sudo -i -u $username node $userdir/c9/server.js --listen 0.0.0.0 --port 8080 -a \$PASS -w /workspace/" >> /root/start.sh

echo "setting hints..."
while read line
do
    echo "echo \"$line\"" >> /etc/profile
done < /root/hint
rm /root/hint

echo "installing c9..."
mkdir /workspace/
chown $username /workspace/

sudo -i -u $username bash -c "echo \"registry = https://registry.npm.taobao.org\" >> $userdir/.npmrc"
mv /root/c9inst.sh $userdir/c9inst.sh
sudo -i -u $username bash $userdir/c9inst.sh -d $userdir/c9/

rm $userdir/c9inst.sh
rm /root/init.sh
