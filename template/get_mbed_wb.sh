# !/bin/bash
# $FileName: get_mbed_wb.sh
# $Date: 07-07-2018
# $Author: Jeasine Ma [jeasinema[at]gmail[dot]com]

# rewrote by benjaminpmlovegood @ 2018/08/15

echo check for mbed-cli...
command -v mbed 1>/dev/null 2>&1 || pip2 install mbed-cli

MBED="python -m mbed"
if command -v mbed 1>/dev/null 2>&1; then
    MBED="mbed"
fi

echo "mbed is $MBED."

echo downloading...
$MBED import mbed-os-example-blinky

instantiateTemplate() {
    name=$1
    path=mbed-$1
    target=$2
    echo "setup mbed $name($target) template in $path..."
    cp -r mbed-os-example-blinky $path
    cd $path
    mkdir src inc
    mv main.cpp src/.
    $MBED toolchain ARM_GCC
    $MBED export -i GCC_ARM -m $target
    echo "pre-building..."
    make -j4
    echo "generating shared sub-makefile..."
    cat `cat Makefile | egrep 'OBJECTS.*mbed.*\.o' | awk '{ print "BUILD/"$NF }' | sed -n 's/\.o/.d/;p'` > BUILD/mbed-os/deps.mf
    echo "deleting temp files..."
    rm -f BUILD/*.elf BUILD/*.bin BUILD/*.hex BUILD/*.link_script.ld
    rm -rf .git/
    echo "cloning cloud9 conf..."
    cp -R ../c9 .c9
    cd ..
}

instantiateTemplate stm32f1 NUCLEO_F103RB
instantiateTemplate stm32f4 NUCLEO_F429ZI

rm -rf mbed-os-example-blinky

#and other templates
tar xf template.tar

echo done.
