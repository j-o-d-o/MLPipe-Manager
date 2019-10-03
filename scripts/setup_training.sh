#!/bin/bash

# this is needed as if called from node.js it wouldnt find the conda command
# TODO: how can this be done without the user having to change the path by hand?
# export PATH="$HOME/miniconda3/bin:$PATH"


##########
## HELP ##
##########
if [[ ( "$1" == "-h" ) || ( "$1" == "--help" ) ]]; then
    echo "Usage: `basename $0` [-h]"
    echo "  Setup MLPipe for local training from MLPipe-Manager"
    echo
    echo "  -h, --help           Show this help text"
    echo "  -s, --source_folder  Source folder name saved to the home directory (relative to user root)"
    echo "  -id, --job_id        job id"
    echo "  -t, --job_token      job token"
    echo "  -u,  --url           url to API"
    echo "  -p, --path           path to config file e.g. path/config.ini (relative to project source folder)"
    echo "  -ts, --train_src     path to ziped source file which will be copied and unziped (relative to user root)"
    echo "  -env, --environment  name of the conda environment"
    exit 0
fi

###################################
## VARIABLE SETTINGS && DEFAULTS ##
###################################
SRC_FOLDER=""
JOB_ID=""
CONFIG_PATH=""
JOB_TOKEN=""
URL=""
TRAIN_SRC=""
ENV=""

#######################
## PARAMETER PARSING ##
#######################
while :
do
    case "$1" in
        -s | --source_folder)
            if [ $# -ne 0 ]; then
                SRC_FOLDER="$2"
            fi
            shift 2
            ;;
        -id | --job_id)
            if [ $# -ne 0 ]; then
                JOB_ID="$2"
            fi
            shift 2
            ;;
        -t | --job_token)
            if [ $# -ne 0 ]; then
                JOB_TOKEN="$2"
            fi
            shift 2
            ;;
        -u | --url)
            if [ $# -ne 0 ]; then
                URL="$2"
            fi
            shift 2
            ;;
        -p | --path)
            if [ $# -ne 0 ]; then
                CONFIG_PATH="$2"
            fi
            shift 2
            ;;
        -ts | --train_src)
            if [ $# -ne 0 ]; then
                TRAIN_SRC="$2"
            fi
            shift 2
            ;;
        -env | --environment)
            if [ $# -ne 0 ]; then
                ENV="$2"
            fi
            shift 2
            ;;
        "")
            break
            ;;
        *)
            echo -e "\033[33mWARNING: Argument $1 is unkown\033[0m"
            shift 2 
    esac
done


###########
## START ##
###########
echo "$TRAIN_SRC"
if [ -f ~/.bashrc ]; then
    echo "[LOG]: source bash profile"
    source ~/.bash_profile
fi
cd ~
echo "[LOG]: create source folder '~/$SRC_FOLDER' if it doesnt exists yet"
mkdir -p ~/$SRC_FOLDER
echo "[LOG]: In case a folder with job_id exists in '~/$SRC_FOLDER', remove it"
rm -rf ~/$SRC_FOLDER/$JOB_ID
rm -rf ~/$SRC_FOLDER/ziped_$JOB_ID
echo "[LOG]: Move zip file from '$TRAIN_SRC' to '~/$SRC_FOLDER' and rename it to job_id: $JOB_ID"
mv $TRAIN_SRC ~/$SRC_FOLDER/ziped_$JOB_ID || { exit 1; }

cd ~/$SRC_FOLDER || { exit 1; }
echo "[LOG]: Unpacking zip file"
unzip -o -q ziped_$JOB_ID -d ~/$SRC_FOLDER/$JOB_ID || { exit 1; }
echo "[LOG]: Remove zip file"
rm -rf ziped_$JOB_ID

# unzip creates a top level directory... thus cd into job_id and then into the first available directory
cd $JOB_ID/* || { exit 1; }
echo "[LOG]: Export current directory to python path"
export PYTHONPATH=$(pwd) || { exit 1; }
echo "[LOG]: Setup conda environment"
conda env update -f environment.yml
echo "[LOG]: activate conda env"
conda activate $ENV || { exit 1; }
echo "[LOG]: Update the config file with job token and API url"
sed -i "/^\[api_manager\]$/,/^\[/ s|^job_token=.*|job_token=$JOB_TOKEN|" $CONFIG_PATH
sed -i "/^\[api_manager\]$/,/^\[/ s|^url=.*|url=$URL|" $CONFIG_PATH
echo "[LOG]: In case Redis is available, start redis server"
redis-server --daemonize yes || true

echo "[LOG]: Setup successfull"