# -*- coding: utf-8 -*-
from pathlib import Path
p = Path("/Users/mind/mindGarden/frontend/src/components/finance/RecurringExpenseModal.js")
t = p.read_text(encoding="utf-8")
t = t.replace("\ufffd\ufffd\uc81c", "\uc0ad\uc81c")
t = t.replace(
    '                                        <XCircle size={20} className="mg-v2-icon-inline" />\n'
    "                                        \ucde0\uc18c\n",
    "                                        \ucde0\uc18c\n",
)
p.write_text(t, encoding="utf-8")
assert "XCircle" not in t
