#!/bin/sh
# created by Benjamin P.M. Lovegood, 2018/07/30 19:23
# install c9sdk

c9git="https://github.com/c9/core.git"

printHelp() {
    echo "usage:";
    echo "  $0 -h";
    echo "    print help information";
    echo "  $0 [-d directory] [-f]";
    echo "    install c9sdk to target directory (specified by \"-d directory\", \"./c9/\" by default)";
    echo "    use -f to force install";
}

if [ "$1" = "-h" ]; then
    printHelp
    exit
fi

di="./c9/";

if [ "$1" = "-d" ]; then
    shift
    di="$1"
    shift
fi

echo "install c9 to $di"

if [ -d "$di" ]; then
    if [ "$1" = "-f" ]; then
        rm -r $di
    else
        echo "directory $di already exists, exit"
        exit
    fi
fi

git clone $c9git $di

echo "initialize c9 in $di"

bash $di/scripts/install-sdk.sh

echo "c9 installed in $di. done."
