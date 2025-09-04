import React, { useEffect, useState } from "react";
import { getBOMResolutions } from "../../api/bomResolutions";
import { useSelector } from "react-redux";

const BOMResolutionPage = () => {
  const [bomResolutions, setBOMResolutions] = useState([]);
  const token = useSelector((state) => state.auth.token) || localStorage.getItem("token");

  useEffect(() => {
    const fetchBOMResolutions = async () => {
      try {
        const data = await getBOMResolutions(token);
        setBOMResolutions(data);
      } catch (err) {
        setBOMResolutions([]);
      }
    };
    fetchBOMResolutions();
  }, [token]);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">BOM Resolutions</h2>
      <div className="bg-white rounded shadow p-4">
        {(bomResolutions.length === 0 ? (
          <ul>
            {/* Hardcoded sample BOM resolutions for 3 institutes */}
            <li className="mb-4">
              <strong>Curriculum Revision</strong> <br />
              <span className="text-sm text-gray-600">KLS GIT &middot; 2024-06-04 10:00 AM</span>
            </li>
            <li className="mb-4">
              <strong>Lab Equipment Purchase</strong> <br />
              <span className="text-sm text-gray-600">KLS GIT &middot; 2024-06-05 11:00 AM</span>
            </li>
            <li className="mb-4">
              <strong>New Course Introduction</strong> <br />
              <span className="text-sm text-gray-600">KLS GOGTE &middot; 2024-06-04 02:00 PM</span>
            </li>
            <li className="mb-4">
              <strong>Faculty Promotion</strong> <br />
              <span className="text-sm text-gray-600">KLS GOGTE &middot; 2024-06-05 03:00 PM</span>
            </li>
            <li className="mb-4">
              <strong>Legal Curriculum Update</strong> <br />
              <span className="text-sm text-gray-600">RL LAW COLLEGE &middot; 2024-06-06 11:00 AM</span>
            </li>
            <li className="mb-4">
              <strong>Library Digitalization</strong> <br />
              <span className="text-sm text-gray-600">RL LAW COLLEGE &middot; 2024-06-07 01:30 PM</span>
            </li>
          </ul>
        ) : (
          <ul>
            {bomResolutions.map((res) => (
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

export default BOMResolutionPage;
