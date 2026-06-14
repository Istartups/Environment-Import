ame="flex items-center gap-2 mb-6">
                        <div className="flex-1 h-px" style={{background:`${theme.hexAccent}30`}} />
                        <span style={{color:theme.hexAccent,fontSize:9,opacity:0.65,letterSpacing:4}}>◆ ◆ ◆</span>
                        <div className="flex-1 h-px" style={{background:`${theme.hexAccent}30`}} />
                      </div>
                      <div className="flex flex-col items-center text-center space-y-2 pb-5">
                        {appLogo && (
                          <div className="w-16 h-16 rounded-full overflow-hidden" style={{border:`1px solid ${theme.hexAccent}40`}}>
                            <img src={appLogo} className="w-full h-full object-cover" alt="Logo" crossOrigin="anonymous" />
                          </div>
                        )}
                        <h2 className="text-lg font-black uppercase tracking-[0.2em]">{businessProfile?.name || appName}</h2>
                        {businessProfile?.tagline && <p className="text-[9px] italic opacity-45">{businessProfile.tagline}</p>}
                        <div className="flex items-center gap-4 justify-center opacity-45 text-[10px]">
                          {businessProfile?.phone && <span className="flex items-center gap-1"><Phone size={8} />{businessProfile.phone}</span>}
                          {socials?.whatsapp && <span className="flex items-center gap-1"><MessageCircle size={8} />{socials.whatsapp}</span>}
                          {businessProfile?.email && <span className="flex items-center gap-1"><Mail size={8} />{businessProfile.email}</span>}
                        </div>
                        {addrLandmark && <p className="text-[10px] opacity-38 flex items-center justify-center gap-1"><MapPin size={8} />{addrLandmark}{addrStateCountry ? `, ${addrStateCountry}` : ""}</p>}
                        {!addrLandmark && addrStateCountry && <p className="text-[10px] opacity-28 text-center">{addrStateCountry}</p>}
                        {!addrLandmark && !addrStateCountry && businessProfile?.address && <p className="text-[10px] opacity-38 flex items-center justify-center gap-1"><MapPin size={8} />{businessProfile.address}</p>}
                        {(socials?.instagram || socials?.facebook || socials?.tiktok || socials?.youtube) && (
                          <div className="flex flex-wrap gap-1.5 justify-center pt-1">
                            {socials?.instagram && <span style={{background:"rgba(255,255,255,0.08)",borderRadius:999,padding:"1px 5px",display:"inline-flex",alignItems:"center",gap:2}}><Instagram size={7} style={{opacity:0.7}} /><span style={{fontSize:7,fontWeight:700,opacity:0.7}}>@{socials.instagram}</span></span>}
                            {socials?.facebook && <span style={{background:"rgba(255,255,255,0.08)",borderRadius:999,padding:"1px 5px",display:"inline-flex",alignItems:"center",gap:2}}><Facebook size={7} style={{opacity:0.7}} /><span style={{fontSize:7,fontWeight:700,opacity:0.7}}>{socials.facebook}</span></span>}
                            {socials?.tiktok && <span style={{background:"rgba(255,255,255,0.08)",borderRadius:999,padding:"1px 5px",display:"inline-flex",alignItems:"center",gap:2}}><Users size={7} style={{opacity:0.7}} /><span style={{fontSize:7,fontWeight:700,opacity:0.7}}>@{socials.tiktok}</span></span>}
                            {socials?.youtube && <span style={{background:"rgba(255,255,255,0.08)",borderRadius:999,padding:"1px 5px",display:"inline-flex",alignItems:"center",gap:2}}><Youtube size={7} style={{opacity:0.7}} /><span style={{fontSize:7,fontWeight:700,opacity:0.7}}>{socials.youtube}</span></span>}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 my-3">
                        <div className="flex-1 h-px" style={{background:`${theme.hexAccent}20`}} />
                        <div className="w-1 h-1 rotate-45" style={{background:`${theme.hexAccent}60`}} />
                        <div className="flex-1 h-px" style={{background:`${theme.hexAccent}20`}} />
                      </div>
                      <div className="text-center py-3">
                        <p className="text-[9px] opacity-28 uppercase tracking-[0.25em]">{selectedRecord.category}</p>
                        <p className="text-sm font-black uppercase tracking-[0.1em] mt-0.5">{selectedRecord.label}</p>
                        <div className="flex justify-center gap-6 mt-2 text-[9px] opacity-35">
                          <span>{selectedCustomer.name}</span>
                          <span>·</span>
                          <span>{new Date().toLocaleDateString("en-GB", {day:"2-digit",month:"short",year:"numeric"})}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-6 py-5">
                        {entries.map(([k, v]) => (
                          <div key={k} className="text-center space-y-0.5">
                            <p className="text-[8px] font-black uppercase tracking-widest opacity-28">{k}</p>
                            <p className="text-xl font-black" style={{color:theme.hexAccent}}>{v}<span className="text-[9px] opacity-35 ml-0.5">{getUnitSymbol(selectedRecord.unit)}</span></p>
                            <div className="h-px w-8 mx-auto" style={{background:`${theme.hexAccent}30`}} />
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-4 mb-3">
                        <div className="flex-1 h-px" style={{background:`${theme.hexAccent}18`}} />
                        <div className="w-1 h-1 rotate-45" style={{background:`${theme.hexAccent}45`}} />
                        <div className="flex-1 h-px" style={{background:`${theme.hexAccent}18`}} />
                      </div>
                      <p className="text-[9px] opacity-28 italic text-center px-4">{customNote || DEFAULT_GLOBAL_NOTE}</p>
                      <p className="text-[7px] opacity-15 uppercase tracking-[0.3em] text-center mt-2">{businessProfile?.name || appName}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── ACTIONS ── */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 px-1 mb-1.5">
                  <Quote size={14} className="text-primary" />
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Card Note (Optional)</label>
                </div>
                <textarea
                  placeholder="Enter a custom instruction for this client..."
                  value={customNote}
                  onChange={e => setCustomNote(e.target.value)}
                  className="w-full text-sm rounded-2xl px-4 py-3 bg-card border border-border focus:border-primary/50 outline-none min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleDownload} disabled={loading || sharing}
                  className="h-14 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50">
                  {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</> : <><Download size={18} /> Save To Device</>}
                </button>
                <button onClick={handlePrint} disabled={loading || sharing}
                  className="h-14 bg-card border border-border rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-muted transition-colors active:scale-[0.98] disabled:opacity-50">
                  {loading ? <><span className="w-4 h-4 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" /> Preparing…</> : <><Printer size={18} /> Print Card</>}
                </button>
              </div>

              <button onClick={copyCardAsText}
                className="w-full h-12 bg-card border border-border rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-muted transition-colors active:scale-[0.98]">
                <Copy size={14} /> Copy as Text
              </button>

              <button onClick={handleShareToCustomer} disabled={sharing || loading}
                className="w-full h-14 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-500/20 transition-colors active:scale-[0.98] disabled:opacity-50">
                {sharing ? <><span className="w-4 h-4 border-2 border-green-500/40 border-t-green-500 rounded-full animate-spin" /> Preparing…</> : <><Share2 size={18} /> Share with {selectedCustomer.name}</>}
              </button>

              <Button onClick={() => setLocation("/invite")} variant="outline"
                className="w-full h-14 rounded-2xl border-primary/20 bg-primary/5 hover:bg-primary/10 font-bold text-primary transition-all">
                <Users className="w-5 h-5 mr-2" /> Invite Another Tailor
              </Button>

              <div className="flex flex-col gap-3 items-center pt-2">
                <button onClick={() => setStep("select_record")} className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">Back to Records</button>
                <div className="flex items-center gap-2 opacity-30">
                  <div className="h-px w-8 bg-muted-foreground" /><ShieldCheck size={12} /><div className="h-px w-8 bg-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}