###############################################
# Global build arguments
###############################################
ARG RUBY_VERSION=3.4

###############################################
# Stage 1 — Builder
###############################################
#FROM ruby:${RUBY_VERSION} AS builder
FROM public.ecr.aws/docker/library/ruby:$RUBY_VERSION-slim AS builder

# Re-declare ARG inside the stage (Docker requirement)
ARG RUBY_VERSION

RUN apt-get update -qq && apt-get install -y \
  build-essential \
  pkg-config \
  libmariadb-dev \
  libssl-dev \
  libxml2-dev \
  libxslt-dev \
  zlib1g-dev \
  libffi-dev \
  shared-mime-info \
  git \
  curl

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

WORKDIR /app

# Install Ruby gems into /vendor/bundle
COPY Gemfile Gemfile.lock ./
RUN bundle config set --local path /vendor/bundle
RUN bundle install --jobs 4 --retry 3

# Install Node dependencies
COPY package.json package-lock.json ./

# Copy only the directories you want
COPY app/ ./app/
COPY config/ ./config/
COPY util/ ./util/
COPY config.ru start.sh main.jsx postcss.config.js vite.config.js ./

RUN npm install
RUN npm run build:prod:all

###############################################
# Stage 2 — Runtime
###############################################
#FROM ruby:${RUBY_VERSION}
FROM public.ecr.aws/docker/library/ruby:$RUBY_VERSION-slim

# Re-declare ARG inside this stage too
ARG RUBY_VERSION

RUN apt-get update -qq && apt-get install -y \
  libssl3 \
  libxml2 \
  libxslt1.1 \
  zlib1g \
  libffi8 \
  libmariadb-dev \
  shared-mime-info \
  curl && \
  apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

RUN mkdir -p /vendor/bundle
COPY --from=builder /vendor/bundle /vendor/bundle

WORKDIR /app

# Copy everything from builder stage
COPY --from=builder app/ .

#RUN npm run build:prod 
#RUN npm run build:prod:all

# Ensure Bundler uses the vendor path
ENV BUNDLE_PATH=/vendor/bundle
ENV BUNDLE_APP_CONFIG=/vendor/bundle 
ENV BUNDLE_BIN=/vendor/bundle/bin 
ENV PATH="${BUNDLE_BIN}:${PATH}"

EXPOSE 80
EXPOSE 4002

CMD ["./start.sh"]

