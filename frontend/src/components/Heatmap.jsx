// src/components/Heatmap.jsx
import React, { useEffect, useState, useRef } from 'react';
import './Heatmap.css';
import zoneInfoMock from '../mock/zoneInfoMock';

export default function Heatmap({
  apiUrl = '/api/zones',
  refreshInterval = 6000,
  width = "100%",
  height = "auto"
}) {
  const [zones, setZones] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [currentZoneId, setCurrentZoneId] = useState(null);
  const [addFlowState, setAddFlowState] = useState(null); // null | 'password' | 'exhibit' | 'loading'
  const [passwordInput, setPasswordInput] = useState('');
  const [exhibitInput, setExhibitInput] = useState('');
  const [pwdError, setPwdError] = useState(null);
  const [removeFlowState, setRemoveFlowState] = useState(null); // null | 'password' | 'list' | 'loading'
  const [removePasswordInput, setRemovePasswordInput] = useState('');
  const [removePwdError, setRemovePwdError] = useState(null);
  const [removeList, setRemoveList] = useState([]);
  const [loadingZone, setLoadingZone] = useState(false);
  const [errorZone, setErrorZone] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const containerRef = useRef(null);

    // Zone names mapping
  const zoneNames = {
      'zone1': 'Hopital', 'zone2': 'ESCAL', 'zone3': 'ACES',
      'zone4': 'Gaming Zone', 'zone5': 'AGRICULTER', 'zone6': 'Industrial',
      'zone7': 'Smart Home', 'zone8': 'Smart Cafe'
  };

    // Full zone labels used in UI (shows zone id + readable name)
    const zoneFullLabels = {
      'zone1': 'zone1 - hospital',
      'zone2': 'zone2 - ESCAL',
      'zone3': 'zone3 - ACES (association of computer engineering students)',
      'zone4': 'zone4 - gaming zone',
      'zone5': 'zone5 - Agricultural zone',
      'zone6': 'zone6 - industrial zone',
      'zone7': 'zone7 - Smart Home',
      'zone8': 'zone8 - Smart Cafe'
    };

  useEffect(() => {
    let mounted = true;
    async function fetchZones() {
      try {
        const res = await fetch(apiUrl);
        const data = await res.json();
        if (mounted) setZones(data || []);
      } catch (err) {
        console.error('fetch zones error', err);
      }
    }

    fetchZones();
    const id = setInterval(fetchZones, refreshInterval);
    return () => { mounted = false; clearInterval(id); };
  }, [apiUrl, refreshInterval]);

  const getVisitors = (id) => {
    const z = zones.find(z => z.zone_id=== id);
    return z ? z.current_visitors : 0;
  };

  const getCapacity = (id) => {
    const capacities = {
      'zone1': 30, 'zone2': 25, 'zone3': 40, 
      'zone4': 20, 'zone5': 35, 'zone6': 15,
      'zone7': 30, 'zone8': 30
    };
    return capacities[id] || 30;
  };

  // Calculate totals - MOVED AFTER function definitions
  const totalCurrent = Object.keys(zoneNames).reduce((sum, zoneId) => sum + getVisitors(zoneId), 0);
  const totalCapacity = Object.keys(zoneNames).reduce((sum, zoneId) => sum + getCapacity(zoneId), 0);
  // Blue gradient color scale (like the reference image)
// Blue → Red gradient scale
const colorFor = (count, id) => {
  if (count === null || count === undefined) return '#e9ecf0';

  const capacity = getCapacity(id);
  const pct = Math.min(100, Math.max(0, (count / capacity) * 100));

   if (pct < 20) return '#7fd88f';  // soft pastel green
  if (pct < 40) return '#fff59b';  // soft pastel yellow
  if (pct < 60) return '#ffd8a6';  // soft pastel orange
  if (pct < 80) return '#ffaaa5';  // soft coral
  return '#ff6b6b';                // soft red
}


  async function fetchZoneInfo(zoneId) {
    setErrorZone(null);
    setCurrentZoneId(zoneId);
    // show mock data immediately if available
    const mock = zoneInfoMock[zoneId];
    if (mock) {
      setModalData(mock);
      setModalOpen(true);
    } else {
      // open modal with no data while loading
      setModalData(null);
      setModalOpen(true);
    }

    setLoadingZone(true);
    try {
      const res = await fetch(`http://localhost:2000/api/zone-info/${zoneId}`);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Request failed: ${res.status}`);
      }
      const data = await res.json();
      setModalData(data);
    } catch (err) {
      console.error('Failed to fetch zone info', err);
      setErrorZone(err.message || 'Failed to fetch zone info');
      // keep mock data displayed if present; otherwise clear
      if (!mock) setModalData(null);
    } finally {
      setLoadingZone(false);
    }
  }

  // Add exhibit flow: show password (masked) then exhibit input
  function startAddFlow() {
    setPwdError(null);
    setPasswordInput('');
    setExhibitInput('');
    setAddFlowState('password');
  }
  // Test Fn Here
  function simpleTest(){
    //setTestMessage('hi');
    alert('hi');
  }


  function cancelAddFlow() {
    setAddFlowState(null);
    setPwdError(null);
    setPasswordInput('');
    setExhibitInput('');
  }

  // Remove flow handlers
  function startRemoveFlow() {
    setRemovePwdError(null);
    setRemovePasswordInput('');
    setRemoveList([]);
    setRemoveFlowState('password');
  }

  function cancelRemoveFlow() {
    setRemoveFlowState(null);
    setRemovePwdError(null);
    setRemovePasswordInput('');
    setRemoveList([]);
  }

  async function submitRemovePassword() {
    if (removePasswordInput !== 'Always#26') {
      setRemovePwdError('Access Denied');
      return;
    }
    setRemovePwdError(null);
    // fetch latest exhibits (we expect objects with id and exhibition_name)
    try {
      setRemoveFlowState('loading');
      const res = await fetch(`http://localhost:2000/api/zone-info/${currentZoneId}`);
      if (!res.ok) throw new Error('Failed to fetch exhibits');
      const data = await res.json();
      const list = Array.isArray(data.exhibitions) ? data.exhibitions : [];
      setRemoveList(list);
      setRemoveFlowState('list');
    } catch (err) {
      console.error('Failed to fetch exhibits for removal', err);
      setRemovePwdError('Failed to load exhibits');
      setRemoveFlowState(null);
    }
  }

  async function deleteExhibit(id) {
    if (!id) return;
    try {
      setRemoveFlowState('loading');
      const res = await fetch(`http://localhost:2000/api/zone-info/${currentZoneId}/exhibit/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Delete failed: ${res.status}`);
      }
      // remove from local list and refresh modal
      setRemoveList((s) => s.filter((it) => String(it.id) !== String(id)));
      await fetchZoneInfo(currentZoneId);
      setRemoveFlowState('list');
    } catch (err) {
      console.error('Failed to delete exhibit', err);
      window.alert('Failed to delete exhibit: ' + (err.message || 'Unknown error'));
      setRemoveFlowState(null);
    }
  }

  function submitPassword() {
    if (passwordInput === 'Always#26') {
      setPwdError(null);
      setAddFlowState('exhibit');
    } else {
      setPwdError('Access Denied');
    }
  }

  async function submitExhibit() {
    if (!exhibitInput || exhibitInput.trim() === '') return;
    setAddFlowState('loading');
    try {
      const res = await fetch(`http://localhost:2000/api/zone-info/${currentZoneId}/exhibit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exhibitName: exhibitInput.trim() })
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Request failed: ${res.status}`);
      }

      // refresh the modal data from server
      await fetchZoneInfo(currentZoneId);
      cancelAddFlow();
    } catch (err) {
      console.error('Failed to add exhibit', err);
      window.alert('Failed to add exhibit: ' + (err.message || 'Unknown error'));
      setAddFlowState(null);
    }
  }

  async function doSearch() {
    if (!searchQuery || searchQuery.trim().length === 0) return;
    setSearchResult(null);
    try {
      const res = await fetch('http://localhost:2000/api/search-zone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      const json = await res.json();
      // json.zone expected
      if (json && json.zone) {
        setSearchResult(json.zone);
      } else {
        setSearchResult('No result');
      }
    } catch (err) {
      console.error('Search error', err);
      setSearchResult('Search failed');
    }
  }



  return (
    <div className="heatmap-container" ref={containerRef}>
      {/* Header Section */}
      <div className="heatmap-header">
        <img src="/peracom.jpg" alt="Left Logo" className="logo" />
        <h2>SMART CITY HEAT MAP</h2>
                 <img src="/engex.jpg" alt="Right Logo" className="logo" />
      </div>

      <div className="main-content">
        {/* Map Container */}
        <div className="map-section">
          <div className="map-container">
            <svg
              className="heatmap-svg"
              viewBox="0 0 36 17"
              width={width}
              height={height}
              role="img"
              aria-label="Exhibition heatmap"
              preserveAspectRatio="xMidYMid meet" 
            >
              {/* Ground (light colors) */}
              <g id="Ground">
                <rect id="XMLID_1_" width="36" height="17" fill="#E6EDF7" stroke="#E6E9EE" strokeWidth="0" />
              </g>

              {/* Static decorative paths (light tones) */}
              <g id="paths">
                <path id="extrazones" d="M19.7,4c-0.4-0.9-0.7-1.7-1.1-2.6c0,1.7,0,3.4,0,5.1c0.7,0,1.4,0,2.2,0C20.4,5.7,20,4.8,19.7,4z" fill="#d9cfa8b9" />
                <path id="open_area" d="M36,17c-1.2,0-2.3,0-3.5,0c-2.4-5.7-4.7-11.3-7.1-17H36V17z" fill="#c674f9b9"/>
                <rect id="XMLID_2_" width="7.6" height="6" fill="#FFF3D9" />
                
                <path id="road"
                      d="M22.5,10.5c-7.5,0-15,0-22.5,0c0-1.3,0-2.7,0-4c6.9,0,13.9,0,20.8,0C21.4,7.8,21.9,9.2,22.5,10.5zM30.4,17c-1.7,0-3.4,0-5.1,0c-1.5-3.5-3-7-4.5-10.4c1.5-0.5,3-0.9,4.5-1.4C27,9.1,28.7,13.1,30.4,17zM8,10.5h0.8v6.5h-0.8zM18.6,1.4c-0.2-0.5-0.4-1-0.6-1.4c0,2.2,0,4.3,0,6.5h0.6V1.4z"
                      fill="#E6EDF7"
                      stroke="none"/>
              </g>

              {/* Zones (dynamic fill) */}
              <g id="zones">
                <rect id="zone1" width="9" height="6.5" className="zone-shape" fill={colorFor(getVisitors('zone1'), 'zone1')}
                  onClick={() => fetchZoneInfo('zone1')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') fetchZoneInfo('zone1'); }} />
                <rect id="zone2" x="10.8" y="-1.7" transform="matrix(-3.384516e-003 -1 1 -3.384516e-003 10.7839 17.2745)" width="6.5" height="7" className="zone-shape" fill={colorFor(getVisitors('zone2'), 'zone2')}
                  onClick={() => fetchZoneInfo('zone2')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') fetchZoneInfo('zone2'); }} />
                <polygon id="zone3" points="16.1,0 18.5,0 21.4,6.49 16.1,6.49" className="zone-shape" fill={colorFor(getVisitors('zone3'), 'zone3')} 
                  onClick={() => fetchZoneInfo('zone3')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') fetchZoneInfo('zone3'); }} />
                <path id="zone4" d="M36,9c-0.5,0-0.9,0-1.4,0c-0.4,0-0.9,0-1.3,0c0-2,0-2.9,0-4.4c0-0.7,0-1.4,0-2.1
                    c-0.5,0-1.2,0-2.1,0c-0.4,0-0.7,0-0.8,0c-1.3,0-2.5,0-3.8,0c0-0.3,0-0.6,0-0.9c0-0.5,0-1,0-1.5c3.1,0,6.3,0,9.4,0
                    c0,0.3,0,0.7,0,1.1c0,0.3,0,0.7,0,1.1c0,0.7,0,1.4,0,1.7C36,4.5,36,6,36,9z" className="zone-shape" fill={colorFor(getVisitors('zone4'), 'zone4')}
                  onClick={() => fetchZoneInfo('zone4')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') fetchZoneInfo('zone4'); }} />
                <rect id="zone5" y="10.5" width="8" height="6.5" className="zone-shape" fill={colorFor(getVisitors('zone5'), 'zone5')}
                  onClick={() => fetchZoneInfo('zone5')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') fetchZoneInfo('zone5'); }} />
                <rect id="zone6" x="8.8" y="10.5" width="7.2" height="6.5" className="zone-shape" fill={colorFor(getVisitors('zone6'), 'zone6')}
                  onClick={() => fetchZoneInfo('zone6')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') fetchZoneInfo('zone6'); }} />
                <rect id="zone7" x="16.1" y="10.5" width="6.3" height="6.5" className="zone-shape" fill={colorFor(getVisitors('zone7'), 'zone7')}
                  onClick={() => fetchZoneInfo('zone7')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') fetchZoneInfo('zone7'); }} />
                <rect id="zone8" x="31.3" y="10" width="4.7" height="4.3" className="zone-shape" fill={colorFor(getVisitors('zone8'), 'zone8')}
                  onClick={() => fetchZoneInfo('zone8')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') fetchZoneInfo('zone8'); }} />
              </g>


              <g id="Entrance">
                {/* Arrow shape (right-pointing) */}
                <polygon points="29.5,14.7 28.8,16 30.2,16" fill="#090909" />
                {/* Optional: label next to arrow */}
                <text  x="29.7" y="16.75" className="entrance-label" fill="#c62121ff" fontSize="0.6" textAnchor="middle"  dominantBaseline="middle"> ENTRANCE </text>
              </g>

              <g id="Exit">
                {/* Arrow shape (downward/south, bigger), between Hospital and Agriculture */}
                <polygon points="0.1,8.7 1.4,8.0 1.4,9.4" fill="#090909" />
                {/* Centered label below the arrow */}
                <text x="2.6" y="8.8" className="exit-label" fill="#c62121ff" fontSize="0.7" textAnchor="middle" dominantBaseline="middle">EXIT</text>
              </g>

              <g id="Extra zones">
                {/* Arrow shape (downward/south, bigger), between Hospital and Agriculture */}
                <polygon points="25,16.95 22.5,10.50 22.5,16.95" fill="#e3cd85ff" />
              </g>


              <g id="zone-labels">
                {/* Hospital Zone Label */}
                <text x="4.5" y="3.5" className="zone-label" fill="#2c3e50" fontSize="0.8" textAnchor="middle" dominantBaseline="middle">Hospital</text>
                {/* ESCAL Zone Label */}
                <text x="12.8" y="3.5" className="zone-label" fill="#2c3e50" fontSize="0.8" textAnchor="middle" dominantBaseline="middle">ESCAL</text>
                {/* Gaming Zone Label */}
                <text x="32" y="1.5" className="zone-label" fill="#2c3e50" fontSize="0.8" textAnchor="middle" dominantBaseline="middle">Gaming Zone</text>
                {/* Agriculture Zone Label */}
                <text x="4" y="13.5" className="zone-label" fill="#2c3e50" fontSize="0.8" textAnchor="middle" dominantBaseline="middle">Agricultural Zone</text>
                {/* Industrial Zone Label */}
                <text x="12.5" y="13.5" className="zone-label" fill="#2c3e50" fontSize="0.8" textAnchor="middle" dominantBaseline="middle">Industrial Zone</text>
                {/* Smart Home Zone Label (if you want to keep it) */}
                <text x="19.5" y="13.5" className="zone-label" fill="#2c3e50" fontSize="0.8" textAnchor="middle" dominantBaseline="middle">Smart Home</text>
                {/* ACES Zone Label */}
                <text x="18" y="3.5" className="zone-label" fill="#2c3e50" fontSize="0.8" textAnchor="middle" dominantBaseline="middle">ACES</text>
                 {/* Smart cafe Zone Label */}
                <text x="33.65" y="12.5" className="zone-label" fill="#2c3e50" fontSize="0.8" textAnchor="middle" dominantBaseline="middle">Smart Cafe</text>
                
              </g>

            </svg>

            {/* Modal for zone details (opened when a zone is clicked) */}
            {modalOpen && (
              <div className="zone-modal-overlay" role="dialog" aria-modal="true">
                <div className="zone-modal">
                  <button className="zone-modal-close" onClick={() => { setModalOpen(false); setModalData(null); setErrorZone(null); }} aria-label="Close">✕</button>
                  {errorZone && (
                    <div className="zone-modal-error">Error: {errorZone}</div>
                  )}
                  {loadingZone && (
                    <div className="zone-modal-updating">Updating from server…</div>
                  )}
                  {modalData ? (
                    <div className="zone-modal-body">
                      <h3>{
                        // If modalData.zone is an id like 'zone1', show the full label
                        // If it is already a labeled string (e.g. from search), fall back to it
                        (modalData.zone && zoneFullLabels[modalData.zone]) || modalData.zone || 'Zone'
                      }</h3>
                          <div className="zone-modal-exhibitions">
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                          <h4>Exhibitions</h4>
                          <div>
                            {!addFlowState && !removeFlowState && (
                              <>
                                <button className="add-exhibit-button" onClick={() => startAddFlow()}>Add Exhibit</button>
                                <button className="add-exhibit-button" style={{marginLeft:8, background:'#c62828'}} onClick={() => startRemoveFlow()}>Remove Exhibit</button>
                                
                              </>
                            )}
                            {addFlowState === 'password' && (
                              <div className="add-flow" style={{display:'flex',gap:8,alignItems:'center'}}>
                                <input
                                  type="password"
                                  placeholder="Admin password"
                                  value={passwordInput}
                                  onChange={(e) => setPasswordInput(e.target.value)}
                                  aria-label="admin-password"
                                  style={{padding:'6px 8px',borderRadius:6,border:'1px solid #ddd'}}
                                />
                                <button className="add-exhibit-button" onClick={submitPassword}>Submit</button>
                                <button className="add-exhibit-button" onClick={cancelAddFlow} style={{background:'#ccc', color:'#111'}}>Cancel</button>
                              </div>
                            )}
                            {removeFlowState === 'password' && (
                              <div className="add-flow" style={{display:'flex',gap:8,alignItems:'center'}}>
                                <input
                                  type="password"
                                  placeholder="Admin password"
                                  value={removePasswordInput}
                                  onChange={(e) => setRemovePasswordInput(e.target.value)}
                                  aria-label="remove-admin-password"
                                  style={{padding:'6px 8px',borderRadius:6,border:'1px solid #ddd'}}
                                />
                                <button className="add-exhibit-button" onClick={submitRemovePassword}>Submit</button>
                                <button className="add-exhibit-button" onClick={cancelRemoveFlow} style={{background:'#ccc', color:'#111'}}>Cancel</button>
                              </div>
                            )}
                            {removeFlowState === 'loading' && (
                              <span style={{marginLeft:8}}>Loading…</span>
                            )}
                            {addFlowState === 'exhibit' && (
                              <div className="add-flow" style={{display:'flex',gap:8,alignItems:'center'}}>
                                <input
                                  type="text"
                                  placeholder="Exhibit name"
                                  value={exhibitInput}
                                  onChange={(e) => setExhibitInput(e.target.value)}
                                  aria-label="exhibit-name"
                                  style={{padding:'6px 8px',borderRadius:6,border:'1px solid #ddd'}}
                                />
                                <button className="add-exhibit-button" onClick={submitExhibit}>Add</button>
                                <button className="add-exhibit-button" onClick={cancelAddFlow} style={{background:'#ccc', color:'#111'}}>Cancel</button>
                              </div>
                            )}
                            {addFlowState === 'loading' && (
                              <span style={{marginLeft:8}}>Adding…</span>
                            )}
                            {pwdError && <div style={{color:'#c62828',marginTop:6}}>{pwdError}</div>}
                            {removePwdError && <div style={{color:'#c62828',marginTop:6}}>{removePwdError}</div>}
                            {removeFlowState === 'list' && (
                              <div style={{marginTop:8}}>
                                <div style={{fontSize:13,fontWeight:600, marginBottom:6}}>Select exhibit to remove:</div>
                                <ul style={{maxHeight:160,overflow:'auto',paddingLeft:18}}>
                                  {removeList && removeList.length > 0 ? removeList.map((it) => (
                                    <li key={it.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                                      <span>{typeof it === 'string' ? it : it.exhibition_name}</span>
                                      {it.id && (
                                        <button className="delete-exhibit-button" onClick={() => deleteExhibit(it.id)}>Delete</button>
                                      )}
                                    </li>
                                  )) : <li style={{fontStyle:'italic'}}>No exhibits to remove</li>}
                                </ul>
                                <div style={{marginTop:6}}>
                                  <button className="add-exhibit-button" onClick={cancelRemoveFlow} style={{background:'#ccc', color:'#111'}}>Close</button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        {Array.isArray(modalData.exhibitions) && modalData.exhibitions.length > 0 ? (
                          <ul>
                            {modalData.exhibitions.map((ex, i) => (
                              <li key={typeof ex === 'object' && ex.id ? ex.id : i}>
                                {typeof ex === 'string' ? ex : ex.exhibition_name}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="zone-modal-empty">No exhibitions currently</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    !loadingZone && <div className="zone-modal-empty">No data</div>
                  )}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="heatmap-legend">
              <div className="legend-title">Zone Map</div>
              <div className="legend-gradient" />
              <div className="legend-labels">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>

            {/* Search widget (lower-right) */}
            <div className="heatmap-search">
              <label className="search-label">I am interested in...</label>
              <div className="search-row">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter topic or exhibit"
                  aria-label="search interest"
                />
                <button onClick={doSearch} className="search-button">Search</button>
              </div>
              {searchResult && (
                <div className="search-result">Go to <strong>{searchResult}</strong></div>
              )}
            </div>


            <div className="zone-total">
              <div className="zone-total-title">Total Occupancy</div>
              <div className="zone-total-numbers">
                <span className="total-count">
                  {totalCurrent}/{totalCapacity}
                </span>
                <span className="total-percentage">
                  {totalCapacity > 0 ? Math.round((totalCurrent / totalCapacity) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        

        {/* Zone Details Sidebar */}
        <div className="zone-details-sidebar">
          <h3>Zone Occupancy Details</h3>
          <div className="zones-list">
            {Object.entries(zoneNames).map(([zoneId, zoneName]) => {
              const visitors = getVisitors(zoneId);
              const capacity = getCapacity(zoneId);
              const percentage = Math.round((visitors / capacity) * 100);
              
              return (
                <div key={zoneId} className="zone-detail-item">
                  <div className="zone-name">{zoneName}</div>
                  <div className="zone-numbers">
                    <span className="visitors-count">{visitors}/{capacity}</span>
                    <span className="percentage">{percentage}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>



          <div className="last-updated">
            Last updated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
}