import React, { useEffect, useState } from "react";
import { getGCResolutions } from "../../api/gcResolutions";
import { useSelector } from "react-redux";

const GCResolutionPage = () => {
  const [gcResolutions, setGCResolutions] = useState([]);
  const token = useSelector((state) => state.auth.token) || localStorage.getItem("token");

  useEffect(() => {
    const fetchGCResolutions = async () => {
      try {
        const data = await getGCResolutions(token);
        setGCResolutions(data);
      } catch (err) {
        setGCResolutions([]);
      }
    };
    fetchGCResolutions();
  }, [token]);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">GC Resolutions</h2>
      <div className="bg-white rounded shadow p-4">
        {(gcResolutions.length === 0 ? (
          <ul>
            {/* Hardcoded sample data for 3 institutes */}
            <li className="mb-4">
              <strong>Approval of Annual Budget</strong> <br />
              <span className="text-sm text-gray-600">KLS GIT &middot; 2024-06-01 10:00 AM</span>
            </li>
            <li className="mb-4">
              <strong>Faculty Recruitment Drive</strong> <br />
              <span className="text-sm text-gray-600">KLS GIT &middot; 2024-06-02 11:00 AM</span>
            </li>
            <li className="mb-4">
              <strong>Infrastructure Upgrade</strong> <br />
              <span className="text-sm text-gray-600">KLS GOGTE &middot; 2024-06-03 09:30 AM</span>
            </li>
            <li className="mb-4">
              <strong>New Hostel Construction</strong> <br />
              <span className="text-sm text-gray-600">KLS GOGTE &middot; 2024-06-04 12:00 PM</span>
            </li>
            <li className="mb-4">
              <strong>Legal Seminar Planning</strong> <br />
              <span className="text-sm text-gray-600">RL LAW COLLEGE &middot; 2024-06-05 03:00 PM</span>
            </li>
            <li className="mb-4">
              <strong>Library Expansion Approval</strong> <br />
              <span className="text-sm text-gray-600">RL LAW COLLEGE &middot; 2024-06-06 04:30 PM</span>
            </li>
          </ul>
        ) : (
          <ul>
            {gcResolutions.map((res) => (
              <li key={res.id} className="mb-2">
                <strong>{res.title || res.subject}</strong> <br />
                {res.description}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
};

export default GCResolutionPage;
