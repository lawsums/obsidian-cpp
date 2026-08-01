class Solution:
    def compareVersion(self, version1: str, version2: str) -> int:
        version1 = list(version1.split('.'))
        version1 = list(map(lambda x: int(x), version1))
        version2 = list(version2.split('.'))
        version2 = list(map(lambda x: int(x), version2))

        n = len(version1)
        m = len(version2)
        for i in range(max(n, m)):
            v1 = version1[i] if i < n else 0  
            v2 = version2[i] if i < m else 0  
            if v1 < v2:
                return -1
            elif v1 > v2:
                return 1

        return 0
								        