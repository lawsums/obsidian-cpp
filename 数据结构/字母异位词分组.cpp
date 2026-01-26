
class Solution {
public:
    vector<vector<string>> groupAnagrams(vector<string>& strs) {
        unordered_map<string, vector<string>> mp;
        vector<vector<string>> ans;

        for (const auto& s : strs) {
            string ss(s.begin(), s.end());
            sort(ss.begin(), ss.end());
            mp[ss].push_back(s);
        }

        for (const auto& [k, v] : mp) {
            ans.push_back(v);
        }

        return ans;

    }
};
