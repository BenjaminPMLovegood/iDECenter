FROM ubuntu:latest
LABEL maintainer="benjaminpmlee@gmail.com"

ENV DEBIAN_FRONTEND noninteractive

COPY init.sh /root/init.sh
COPY c9inst.sh /root/c9inst.sh
COPY start.sh /root/start.sh

RUN /root/init.sh && /root/c9inst.sh -d /root/c9/

EXPOSE 8080
CMD /root/start.sh
