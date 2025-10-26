import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useGetClusterLeaderboardQuery, useGetMyRankQuery } from './leaderboardApi';
import { useSelector } from 'react-redux';
export default function LeaderBoardPage() {
    const [cluster, setCluster] = useState('Bangalore North');
    const employeeId = useSelector((s) => s.auth.user?.employee_id || 0);
    const { data: rows } = useGetClusterLeaderboardQuery(cluster, { skip: !cluster });
    const { data: myRank } = useGetMyRankQuery(employeeId, { skip: !employeeId });
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h1", { className: "text-lg font-bold", children: "Leaderboard" }), _jsx("input", { className: "border px-2 py-1", value: cluster, onChange: (e) => setCluster(e.target.value) })] }), myRank?.data?.Ranking ? _jsxs("p", { children: ["Your Rank: #", myRank.data.Ranking] }) : null, _jsx("ul", { className: "space-y-1", children: (rows ?? []).map((r, i) => (_jsxs("li", { className: "border px-3 py-2 rounded", children: ["#", r.Ranking, " \u2022 ", r.employee_name ?? r.employee_id] }, i))) })] }));
}
