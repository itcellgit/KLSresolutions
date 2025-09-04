import React, { useEffect, useState } from "react";
import { getMembers } from "../../api/members";
import { useSelector } from "react-redux";

const MembersPage = () => {
  const [members, setMembers] = useState([]);
  const token = useSelector((state) => state.auth.token) || localStorage.getItem("token");

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await getMembers(token);
        setMembers(data);
      } catch (err) {
        setMembers([]);
      }
    };
    fetchMembers();
  }, [token]);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Members</h2>
      <div className="bg-white rounded shadow p-4">
        {members.length === 0 ? (
          <p>No members found.</p>
        ) : (
          <ul>
            {members.map((mem) => (
              <li key={mem.id} className="mb-2">
                <strong>{mem.name}</strong> <br />
                {mem.phone}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MembersPage;
