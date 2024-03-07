#!/bin/bash

for i in "$@"; do
  case $i in
    -e=*|--environment=*)
      ENVIRONMENT="${i#*=}"
      shift
      ;;
    -*|--*)
      echo "Unknown option $i"
      exit 1
      ;;
    *)
      ;;
  esac
done

VALID_ENVS=( "dev" "prod" "local" )
if [[ ! " ${VALID_ENVS[*]} " =~ [[:space:]]${ENVIRONMENT}[[:space:]] ]]; then
  echo "invalid argument for environment: $ENVIRONMENT"
  exit 1
fi

echo "Using environment: $ENVIRONMENT"

case $ENVIRONMENT in

  dev | local)
    PROJECT="${PROJECT_ID:-quirkles-potw}"
    ;;

  prod)
    PROJECT="${PROJECT_ID:-quirkles-potw}"
    ;;

  *)
    echo -n "Encountered unknown environment while trying to determine firebase project"
    exit 1
    ;;
esac

if [ -e ./functions/.env.$ENVIRONMENT.enc ]; then
  echo "Decrypting file: .env.$ENVIRONMENT.enc"
  echo "./functions/.env.$ENVIRONMENT.enc" | sed  -r "s|\.env\.([a-z]+)\.enc|.env.\1|g" | xargs -I % sh -c "gcloud kms decrypt --key=env_encryption --keyring=encryption_keys --location=us-central1 --plaintext-file=% --ciphertext-file=%.enc --project=$PROJECT"
  echo "Decrypted file: .env.$ENVIRONMENT"
else
  echo "No file at .env.$ENVIRONMENT.enc to decrypt"
fi
