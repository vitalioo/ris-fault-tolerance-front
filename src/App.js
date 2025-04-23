import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [hash, setHash] = useState("");
  const [maxLength, setMaxLength] = useState("");
  const [requestId, setRequestId] = useState("");
  const [status, setStatus] = useState(null);        // full HashStatusResponse
  const pollRef = useRef(null);                      // id для clearInterval

  /* ───────── helpers ───────── */
  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = (id) => {
    stopPolling();
    pollRef.current = setInterval(() => handleCheckStatus(id, true), 3000);
  };

  /* ───────── API calls ───────── */
  const handleStart = async () => {
    try {
      const res = await axios.post(
          "http://localhost:8080/internal/api/manager/hash/crack",
          { hash, maxLength: parseInt(maxLength) }
      );
      setRequestId(res.data.requestId);
      setStatus(null);
      startPolling(res.data.requestId);
    } catch (err) {
      alert("Ошибка при отправке: " + err.message);
    }
  };

  const handleCheckStatus = async (id = requestId, silent = false) => {
    if (!id) return;
    try {
      const res = await axios.post(
          "http://localhost:8080/internal/api/manager/hash/status",
          { requestId: id }
      );
      setStatus(res.data);
      if (res.data.percentage === 100) stopPolling();
    } catch (err) {
      if (!silent) alert("Ошибка при проверке: " + err.message);
    }
  };

  /* ───────── side-effects ───────── */
  useEffect(() => stopPolling, []); // зачистка интервала при размонтировании

  /* ───────── UI ───────── */
  return (
      <div className="container">
        <h1>🔐 Hash Cracker</h1>

        <div className="form">
          <input
              type="text"
              placeholder="MD5-хеш"
              value={hash}
              onChange={(e) => setHash(e.target.value)}
          />
          <input
              type="number"
              placeholder="Макс. длина"
              value={maxLength}
              onChange={(e) => setMaxLength(e.target.value)}
          />
          <button onClick={handleStart}>🚀 Старт</button>
        </div>

        <div className="form">
          <input
              type="text"
              placeholder="Request ID"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
          />
          <button onClick={() => handleCheckStatus()}>🔍 Проверить</button>
        </div>

        {status && (
            <div className="result">
              <p>
                <strong>Status:</strong> {status.status}
              </p>

              {/* progress bar */}
              <div className="progress-wrap">
                <div
                    className="progress-bar"
                    style={{ width: `${status.percentage}%` }}
                />
              </div>
              <p>{status.percentage}%</p>

              {/* show data only on 100 % */}
              {status.percentage === 100 && (
                  <p>
                    <strong>Found words:</strong>{" "}
                    {status.data && status.data.length > 0 ? status.data : "—"}
                  </p>
              )}
            </div>
        )}
      </div>
  );
}

export default App;
