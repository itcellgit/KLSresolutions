import React, { useEffect, useState } from "react";
import { getInstitutes } from "../../api/institutes";
import { useSelector } from "react-redux";

const InstitutesPage = () => {
  const [institutes, setInstitutes] = useState([]);
  const token = useSelector((state) => state.auth.token) || localStorage.getItem("token");

  useEffect(() => {
    const fetchInstitutes = async () => {
      try {
        const data = await getInstitutes(token);
        setInstitutes(data);
      } catch (err) {
        setInstitutes([]);
      }
    };
    fetchInstitutes();
  }, [token]);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Institutes</h2>
      <div className="bg-white rounded shadow p-4">
        {institutes.length === 0 ? (
          <p>No institutes found.</p>
        ) : (
          <ul>
            {institutes.map((inst) => (
              <li key={inst.id} className="mb-2">
                <strong>{inst.name}</strong> <br />
                {inst.phone}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default InstitutesPage;
