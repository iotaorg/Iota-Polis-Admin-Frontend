# Set nginx base image
FROM nginx

# File Author / Maintainer
MAINTAINER Renato CRON

RUN rm /etc/nginx/conf.d/default.conf

# Copy custom configuration file from the current directory
COPY nginx.conf /etc/nginx/nginx.conf

ENV API_ADDRESS 192.168.1.125:5000

RUN sed -i 's/__API_ADDRESS__/'"$API_ADDRESS"'/g' /etc/nginx/nginx.conf


