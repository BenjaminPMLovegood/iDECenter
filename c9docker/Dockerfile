FROM ubuntu:latest
LABEL maintainer="benjaminpmlee@gmail.com"

ENV DEBIAN_FRONTEND noninteractive

ADD files.tar /root

RUN /root/init.sh

EXPOSE 8080
CMD bash /root/start.sh
