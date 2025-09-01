# scripts/clear_group.py
import argparse
from graphiti_client import GraphitiClient


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--group", required=True, help="group_id a borrar")
    args = p.parse_args()
    cli = GraphitiClient()
    print(cli.healthcheck())
    cli.clear_group(args.group)
    print(f"Grupo '{args.group}' borrado.")


if __name__ == "__main__":
    main()
