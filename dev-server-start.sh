#!/bin/env bash
set -o pipefail
set -e

function main()
{
    cd "$(dirname "$0")"
    if [[ ! -f "config.py" ]]
    then
        local SECRET_KEY="$(head -c 4096 /dev/urandom | sha512sum | sed 's/ .*//')"
        cat > config.py << EOF
#!/bin/env python3
SECRET_KEY = "$SECRET_KEY"
EOF

    fi
    if [[ ! -f "venv/bin/activate" ]]
    then
        python3 -m venv venv
    fi
    python3 -m pip install -r requirements.txt

    python3 server.py
}

main
