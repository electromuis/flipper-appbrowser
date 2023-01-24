# flipper-appbrowser

Available at: https://flipper-apps.electromuis.nl/

This application is an app browser for flipper-zero apps. It uses github by searching all repositories with an "application.fam" file. The backend uses python + flask and the frontend vue + bootstrap

When downloading an application the backend will:
 - Clone the application repo in a temp folder
 - Build the app with https://github.com/flipperdevices/flipperzero-ufbt
 - Serve the built .fap file to the user

This is still a first concept, please do send pull requests with improvements!

## Running the project with docker
```
docker-compose up
```


