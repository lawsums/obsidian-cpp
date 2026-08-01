
class Solution:
    def isValid(self, s: str) -> bool:
        mp = {'}':'{', ']':'[', ')':'('}
        stk = []
        for i, c in enumerate(s):
            if c in "{[(":
                stk.append(c)
            else: # c in "}])"
                if len(stk) != 0 and mp[c] == stk[-1]:
                    stk.pop()
                else:
                    return False
        
        return len(stk) == 0