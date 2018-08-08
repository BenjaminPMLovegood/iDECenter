echo 'root:fxckyourself' | chpasswd
echo -e "LANG=\"en_US.UTF-8\"" > /etc/default/local

apt-get update
apt-get upgrade -y

apt-get install -y apt-utils
apt-get install -y sudo nodejs npm git g++ curl tmux

echo "registry = https://registry.npm.taobao.org" >> ~/.npmrc
