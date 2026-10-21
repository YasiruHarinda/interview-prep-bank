@section trie | Tries
@blurb A tree of characters for fast prefix searches. Use it for autocomplete, dictionaries, wildcard search and searching many words at once.

### [2] Implement Trie (Prefix Tree)
@lc 208
@ask Build a trie with insert(word), search(word), which needs the full word, and starts_with(prefix).
@eg insert("apple"); search("apple") -> true; search("app") -> false; starts_with("app") -> true
@tags trie, design, strings
@hook Each node maps a letter to a child node and has an "end of word" flag. Every operation walks one node per character.
@say
"A trie stores words as paths from the root, one character per edge. Words with the same prefix share the same path, which is what makes prefix searches fast.

Each node has a map of children and a flag `is_word` that marks where a complete word ends. Insert walks down character by character, creating missing nodes, and sets the flag at the end. Search and starts_with both walk down the path. If a character is missing, the answer is false. Search also needs the flag at the last node, while starts_with only needs the path to exist.

Every operation is O(L), where L is the word's length, no matter how many words are stored. Space is O(total characters inserted)."
@code
```python
class TrieNode:
    def __init__(self):
        self.children = {}               # letter -> TrieNode
        self.is_word = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for ch in word:
            node = node.children.setdefault(ch, TrieNode())
        node.is_word = True

    def _walk(self, text):               # the node at the end of text, or None
        node = self.root
        for ch in text:
            node = node.children.get(ch)
            if node is None:
                return None
        return node

    def search(self, word):
        node = self._walk(word)
        return node is not None and node.is_word

    def starts_with(self, prefix):
        return self._walk(prefix) is not None
```
@time O(L) per operation
@space O(total characters)
@follow When would you use a trie instead of a hash set of words?
When you need prefix questions: autocomplete, "does any word start with this?", or searching many words in a grid at once. A hash set only answers exact matches.
@test
t = Trie()
t.insert("apple")
assert t.search("apple")
assert not t.search("app")
assert t.starts_with("app")
t.insert("app")
assert t.search("app")
assert not t.starts_with("b")
assert not t.search("")
assert t.starts_with("")

### [2] Design Add and Search Words Data Structure
@lc 211
@ask Support add_word(word) and search(word), where "." in a search matches any letter.
@eg add "bad", "dad", "mad"; search(".ad") -> true; search("b..") -> true; search("pad") -> false
@tags trie, dfs, design
@hook A trie, plus DFS for ".": at a dot, try every child and succeed if any branch matches.
@say
"I store the words in a trie. Here I use nested dictionaries, with a special key '$' that marks the end of a word.

Search is a DFS over the trie with an index into the pattern. For a normal letter, I follow that one child if it exists. For a dot, I try every child and return true if any of them matches the rest. When I reach the end of the pattern, it's a match only if the '$' marker is there.

add_word is O(L). Search is O(L) without dots, but with dots it can branch, up to O(26 to the power of the number of dots) in the worst case."
@code
```python
class WordDictionary:
    def __init__(self):
        self.root = {}                   # nested dicts, "$" marks a word end

    def add_word(self, word):
        node = self.root
        for ch in word:
            node = node.setdefault(ch, {})
        node["$"] = True

    def search(self, word):
        def dfs(node, i):
            if i == len(word):
                return "$" in node
            ch = word[i]
            if ch == ".":                # any letter: try every child
                return any(dfs(child, i + 1) for key, child in node.items() if key != "$")
            return ch in node and dfs(node[ch], i + 1)

        return dfs(self.root, 0)
```
@time O(L) add, up to O(26^d * L) search with d dots
@space O(total characters)
@test
wd = WordDictionary()
for w in ["bad", "dad", "mad"]:
    wd.add_word(w)
assert not wd.search("pad")
assert wd.search("bad")
assert wd.search(".ad")
assert wd.search("b..")
assert not wd.search("b.")
assert wd.search("...")
assert not wd.search("....")
assert not wd.search("")

### [3] Word Search II
@lc 212
@ask Return every word from a list that can be spelled in the grid by moving up, down, left or right, without reusing a cell in one word.
@eg grid ["oaan","etae","ihkr","iflv"], words ["oath","pea","eat","rain"]  ->  ["eat","oath"]
@tags trie, backtracking, grid
@hook Put all words in a trie and run one DFS per cell that follows the trie. A dead prefix stops the search at once, for every word.
@say
"Running Word Search once for each word is slow when there are many words. Instead I put all the words into a trie and search the grid once.

From each cell, I DFS through the grid and walk down the trie at the same time. If the current letter isn't a child of the current trie node, no word continues this way, so I stop immediately. When I reach a node that ends a word, I record the word and remove the marker so it isn't found twice. As in Word Search, I mark the cell while it's on the path and restore it after.

One more speed-up: after exploring a trie node, if it has no children left, I delete it from its parent, so finished branches are never searched again. Worst case is O(rows times cols times 4 times 3 to the L), but the trie prunes most of it."
@code
```python
def find_words(board, words):
    root = {}
    for w in words:                           # trie of every word
        node = root
        for ch in w:
            node = node.setdefault(ch, {})
        node["$"] = w                         # the word ends here
    rows, cols = len(board), len(board[0])
    found = []

    def dfs(r, c, parent):
        ch = board[r][c]
        node = parent[ch]
        if "$" in node:
            found.append(node.pop("$"))       # record it once
        board[r][c] = "#"                     # used on this path
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols and board[nr][nc] in node:
                dfs(nr, nc, node)
        board[r][c] = ch                      # restore
        if not node:
            parent.pop(ch)                    # prune a finished branch

    for r in range(rows):
        for c in range(cols):
            if board[r][c] in root:
                dfs(r, c, root)
    return found
```
@time O(R * C * 3^L), L = longest word
@space O(total characters in words)
@test
board = [list("oaan"), list("etae"), list("ihkr"), list("iflv")]
assert sorted(find_words(board, ["oath", "pea", "eat", "rain"])) == ["eat", "oath"]
assert find_words([list("ab"), list("cd")], ["abcb"]) == []
assert find_words([["a"]], ["a"]) == ["a"]
words = ["ab", "cb", "ad", "bd", "ac", "ca", "da", "bc", "db", "adcb", "dabc", "abb", "acb"]
assert sorted(find_words([list("ab"), list("cd")], words)) == ["ab", "ac", "bd", "ca", "db"]

### [2] Search Suggestions System
@lc 1268
@ask After each character typed of search_word, return up to three products, in alphabetical order, that start with what has been typed so far.
@eg products = ["mobile","mouse","moneypot","monitor","mousepad"], search_word = "mouse"  ->  "m": ["mobile","moneypot","monitor"], ..., "mou": ["mouse","mousepad"]
@tags trie, binary search, sorting
@hook Sort the products. Either store the first three products at each trie node, or binary search for the prefix and take the next three.
@say
"I sort the products first, so the first matches for any prefix are already in alphabetical order.

The trie version stores, at each node, the first three products that pass through it. Because products are inserted in sorted order, those are the three smallest. Answering each typed prefix is then just one step down the trie.

The simpler version uses binary search: for each prefix, find the first product that is greater than or equal to the prefix, and take up to three products from there that still start with the prefix.

Sorting is O(n log n). The trie answers each step in O(1) after O(total characters) to build. Binary search costs O(L log n) per step."
@code
```python
import bisect

def suggested_products(products, search_word):
    products = sorted(products)
    result, prefix = [], ""
    for ch in search_word:
        prefix += ch
        i = bisect.bisect_left(products, prefix)          # first product >= prefix
        result.append([p for p in products[i:i + 3] if p.startswith(prefix)])
    return result

def suggested_products_trie(products, search_word):
    root = {}
    for p in sorted(products):
        node = root
        for ch in p:
            node = node.setdefault(ch, {})
            node.setdefault("#", [])                      # "#": up to 3 suggestions
            if len(node["#"]) < 3:
                node["#"].append(p)
    result, node = [], root
    for ch in search_word:
        node = node.get(ch, {})                           # {} once nothing matches
        result.append(node.get("#", []))
    return result
```
@time O(n log n + L log n)
@space O(total characters)
@test
for f in (suggested_products, suggested_products_trie):
    p = ["mobile", "mouse", "moneypot", "monitor", "mousepad"]
    assert f(p, "mouse") == [["mobile", "moneypot", "monitor"], ["mobile", "moneypot", "monitor"],
                             ["mouse", "mousepad"], ["mouse", "mousepad"], ["mouse", "mousepad"]]
    assert f(["havana"], "havana") == [["havana"]] * 6
    assert f(["havana"], "tatiana") == [[]] * 7
    assert f(["bags", "baggage", "banner", "box", "cloths"], "bags") == [["baggage", "bags", "banner"], ["baggage", "bags", "banner"], ["baggage", "bags"], ["bags"]]
