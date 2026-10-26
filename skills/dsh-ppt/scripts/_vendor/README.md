# Vendored dependencies

`pptd.py` runs on the Python that DSH's `load_workspace_dependencies` provides (python-pptx, lxml, Pillow), which does not include a YAML parser. This directory carries the pure-Python sources of PyYAML so the script needs nothing else.

| Package | Version | License | Source |
|---|---|---|---|
| PyYAML | 6.0.3 | MIT (`yaml/LICENSE`) | https://pypi.org/project/PyYAML/6.0.3/ — `lib/yaml/*.py` unchanged; `cyaml.py` (libyaml binding) omitted |

`pptd.py` prefers an installed `yaml` module and only falls back to this copy.
