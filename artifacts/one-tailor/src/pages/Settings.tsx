rounded-xl bg-muted/30 border border-border outline-none text-sm" autoFocus />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Currency Code</label>
                    <input value={customCode} onChange={e => setCustomCode(e.target.value.toUpperCase())} placeholder="e.g. INR, JPY" className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border outline-none text-sm" maxLength={5} />
                  </div>
                </div>
                <button onClick={addCustomCurrency} disabled={!customSymbol.trim() || !customCode.trim()} className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm disabled:opacity-50">
                  Set Currency
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. DISPLAY TAB */}
        {activeTab === "display" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-card border border-border rounded-3xl overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/20">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Theme</p>
              </div>
              <div className="flex items-center justify-between px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-500"}`}>
                    {darkMode ? <Moon size={20} /> : <Sun size={20} />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Dark Mode</p>
                    <p className="text-xs text-muted-foreground font-medium">{darkMode ? "Eye-friendly dark theme" : "Standard light theme"}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="w-12 h-6 rounded-full transition-colors relative"
                  style={{ background: darkMode ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
                >
                  <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
                    style={{ transform: darkMode ? "translateX(24px)" : "translateX(0)" }} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. MESSAGES TAB */}
        {activeTab === "messages" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {["WhatsApp", "Email", "SMS"].map((type) => (
              <div key={type} className="bg-card border border-border rounded-3xl overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/20 flex items-center gap-3">
                  {type === "WhatsApp" ? <MessageCircle size={16} className="text-green-500" /> : type === "Email" ? <Mail size={16} className="text-blue-500" /> : <Smartphone size={16} className="text-purple-500" />}
                  <div>
                    <p className="text-xs font-black">{type} Templates</p>
                    <p className="text-[9px] text-muted-foreground font-medium">Pre-filled message templates</p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    type === "WhatsApp" ? [
                      { name: "Order Ready", text: `Hello! Your order is ready for pickup. Thank you for choosing ${businessProfile?.name || appName || "us"}! 🙏` },
                      { name: "Reminder", text: `Hi! Just a reminder about your appointment with ${businessProfile?.name || appName || "us"}. Please confirm. 😊` },
                    ] : type === "Email" ? [
                      { name: "Order Ready", subject: "Your Order is Ready!", body: `Dear Customer,\n\nYour order is ready for pickup.\n\nKind regards,\n${businessProfile?.name || appName || "OneTailor"}` },
                      { name: "Payment Received", subject: "Payment Received", body: `Dear Customer,\n\nWe've received your payment. Thank you!\n\nKind regards,\n${businessProfile?.name || appName || "OneTailor"}` },
                    ] : [
                      { name: "Order Ready", text: "Your order is ready! Please come pick it up. Thank you for choosing us!" },
                      { name: "Reminder", text: "Reminder: Your appointment is coming up. Please confirm or call to reschedule." },
                    ]
                  ].map((tpl: any, i: number) => (
                    <div key={i} className="bg-muted/30 rounded-2xl p-4 space-y-2.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{tpl.name}</p>
                      {tpl.subject && <p className="text-[10px] font-bold text-muted-foreground">Subject: {tpl.subject}</p>}
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{tpl.text || tpl.body}</p>
                      <button
                        onClick={() => {
                          if (type === "WhatsApp") window.open(`https://wa.me/?text=${encodeURIComponent(tpl.text)}`, '_blank');
                          else if (type === "Email") window.open(`mailto:?subject=${encodeURIComponent(tpl.subject || "")}&body=${encodeURIComponent(tpl.body)}`, '_blank');
                          else window.open(`sms:?body=${encodeURIComponent(tpl.text)}`);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all active:scale-95 ${
                          type === "WhatsApp" ? "bg-green-500/10 hover:bg-green-500/20 text-green-600" : 
                          type === "Email" ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-600" : 
                          "bg-purple-500/10 hover:bg-purple-500/20 text-purple-600"
                        }`}
                      >
                        {type === "WhatsApp" ? <MessageCircle size={11} /> : type === "Email" ? <Mail size={11} /> : <Smartphone size={11} />}
                        Send via {type}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. BACKUP TAB */}
        {activeTab === "backup" && <BackupTab isPremium={isPremium} toast={toast} />}

        {/* 5. ABOUT TAB */}
        {activeTab === "about" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center space-y-4 py-8">
              <div className="w-24 h-24 rounded-3xl bg-card border border-border shadow-xl mx-auto flex items-center justify-center p-4">
                <img src="/onetailor-logo.png" className="w-full h-full object-contain" alt="OneTailor Logo" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">OneTailor</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Tailors Toolkit</p>
              </div>
              <span className="text-xs font-bold text-muted-foreground">Version {APP_VERSION}</span>
            </div>

            {/* Links */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden">
              <button onClick={() => window.open("https://onetailor.com/privacy", "_blank")} className="w-full flex items-center justify-between px-6 py-4 border-b border-border hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Globe size={16} className="text-muted-foreground" />
                  <span className="text-sm">Privacy Policy</span>
                </div>
                <ExternalLink size={14} className="text-muted-foreground" />
              </button>
              <button onClick={() => window.open("https://onetailor.com/terms", "_blank")} className="w-full flex items-center justify-between px-6 py-4 border-b border-border hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-muted-foreground" />
                  <span className="text-sm">Terms of Service</span>
                </div>
                <ExternalLink size={14} className="text-muted-foreground" />
              </button>
              <button onClick={() => window.open("https://wa.me/2348012345678", "_blank")} className="w-full flex items-center justify-between px-6 py-4 border-b border-border hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <HelpCircle size={16} className="text-muted-foreground" />
                  <span className="text-sm">Contact Support</span>
                </div>
                <ExternalLink size={14} className="text-muted-foreground" />
              </button>
              <button onClick={() => window.open("https://onetailor.com/rate", "_blank")} className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Heart size={16} className="text-rose-500" />
                  <span className="text-sm">Rate OneTailor</span>
                </div>
                <ExternalLink size={14} className="text-muted-foreground" />
              </button>
            </div>

            <p className="text-[10px] text-muted-foreground text-center">© 2026 OneTailor Digital Services</p>
          </div>
        )}

      </div>
    </div>
  );
}