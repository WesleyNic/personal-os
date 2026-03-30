const FC_COLORS = ["#534ab7","#0f6e56","#185fa5","#854f0b","#993556","#3b6d11","#993c1d"];

function Flashcards({ subjects, saveSubjects, topics, saveTopics, cards, saveCards }) {
  const [view, setView] = React.useState("subjects");
  const [activeSubjectId, setActiveSubjectId] = React.useState(null);
  const [activeTopicId, setActiveTopicId] = React.useState(null);
  const [studyMode, setStudyMode] = React.useState(false);

  const safeSubjects = subjects || [];
  const safeTopics = topics || [];
  const safeCards = cards || [];

  const activeSubject = safeSubjects.find(s => s.id === activeSubjectId) || null;
  const activeTopic = safeTopics.find(t => t.id === activeTopicId) || null;

  const subjectColor = (id) => {
    const idx = safeSubjects.findIndex(s => s.id === id);
    return FC_COLORS[Math.max(idx, 0) % FC_COLORS.length];
  };

  const goToSubjects = () => { setView("subjects"); setActiveSubjectId(null); setActiveTopicId(null); setStudyMode(false); };
  const goToTopics = (sub) => { setActiveSubjectId(sub.id); setActiveTopicId(null); setView("topics"); setStudyMode(false); };
  const goToCards = (topic) => { setActiveTopicId(topic.id); setView("cards"); setStudyMode(false); };
  const goStudy = (topic) => { setActiveTopicId(topic.id); setStudyMode(true); };

  const topicsForSubject = activeSubject ? safeTopics.filter(t => t.subjectId === activeSubject.id) : [];
  const cardsForTopic = activeTopic ? safeCards.filter(c => c.topicId === activeTopic.id) : [];
  const color = subjectColor(activeSubjectId);

  if (studyMode && activeTopic && cardsForTopic.length > 0)
    return React.createElement(StudyMode, { topic: activeTopic, cards: cardsForTopic, color, onExit: () => setStudyMode(false) });
  if (view === "cards" && activeTopic && activeSubject)
    return React.createElement(CardView, { topic: activeTopic, subject: activeSubject, color, cards: cardsForTopic, saveCards, onBack: () => setView("topics"), onStudy: () => setStudyMode(true) });
  if (view === "topics" && activeSubject)
    return React.createElement(TopicView, { subject: activeSubject, color, topics: topicsForSubject, saveTopics, cards: safeCards, saveCards, onBack: goToSubjects, onStudy: goStudy, onOpenTopic: goToCards });
  return React.createElement(SubjectView, { subjects: safeSubjects, saveSubjects, topics: safeTopics, cards: safeCards, subjectColor, onOpen: goToTopics });
}

function SubjectView({ subjects, saveSubjects, topics, cards, subjectColor, onOpen }) {
  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState("");
  const [confirmDel, setConfirmDel] = React.useState(null);

  const add = () => {
    if (!name.trim()) return;
    saveSubjects(p => [...(p||[]), { id: uid(), name: name.trim(), created: today() }]);
    setName(""); setAdding(false);
  };
  const del = (id) => { saveSubjects(p => (p||[]).filter(s => s.id !== id)); setConfirmDel(null); };

  return React.createElement("div", null,
    React.createElement("div", { style: { ...s.row, justifyContent:"space-between", marginBottom:"1.25rem" } },
      React.createElement("span", { style: { color:"#aaa", fontSize:13 } }, `${subjects.length} subject${subjects.length!==1?"s":""}`),
      React.createElement("button", { style: s.btn("primary"), onClick: () => setAdding(a => !a) }, "+ New subject")
    ),
    adding && React.createElement("div", { style: { ...s.card, marginBottom:"1.25rem" } },
      React.createElement("div", { style: s.row },
        React.createElement("input", { style: { ...s.input, flex:1 }, placeholder:"Subject name…", value:name, onChange: e => setName(e.target.value), onKeyDown: e => e.key==="Enter" && add() }),
        React.createElement("button", { style: s.btn("primary"), onClick: add }, "Add"),
        React.createElement("button", { style: s.btn("ghost"), onClick: () => { setAdding(false); setName(""); } }, "Cancel")
      )
    ),
    subjects.length === 0 && !adding && React.createElement("div", { style: { color:"#555", fontSize:14, textAlign:"center", marginTop:"2rem" } }, "No subjects yet. Create one above."),
    React.createElement("div", { style: { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:12 } },
      subjects.map(sub => {
        const col = subjectColor(sub.id);
        const subTopics = (topics||[]).filter(t => t.subjectId === sub.id);
        const subCards = (cards||[]).filter(c => subTopics.map(t => t.id).includes(c.topicId));
        return React.createElement("div", { key: sub.id, style: { ...s.noteCard, borderTop:`3px solid ${col}`, position:"relative", cursor:"pointer" }, onClick: () => confirmDel !== sub.id && onOpen(sub) },
          React.createElement("div", { style: { ...s.row, marginBottom:8 } },
            React.createElement("span", { style: { fontWeight:500, fontSize:16, flex:1 } }, sub.name),
            React.createElement("button", { style: s.del, onClick: e => { e.stopPropagation(); setConfirmDel(sub.id); } }, "×")
          ),
          React.createElement("div", { style: { fontSize:12, color:"#555" } }, `${subTopics.length} topic${subTopics.length!==1?"s":""} · ${subCards.length} card${subCards.length!==1?"s":""}`),
          React.createElement("div", { style: { fontSize:11, color:"#444", marginTop:4 } }, `Added ${sub.created}`),
          confirmDel === sub.id && React.createElement("div", { style: { position:"absolute", inset:0, background:"#0f0f13ee", borderRadius:12, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, padding:"1rem", zIndex:2 } },
            React.createElement("span", { style: { fontSize:13, color:"#f0f0f5", textAlign:"center" } }, `Delete "${sub.name}" and all its cards?`),
            React.createElement("div", { style: s.row },
              React.createElement("button", { style: { ...s.btn("primary"), background:"#a32d2d", borderColor:"#e24b4a" }, onClick: e => { e.stopPropagation(); del(sub.id); } }, "Delete"),
              React.createElement("button", { style: s.btn("ghost"), onClick: e => { e.stopPropagation(); setConfirmDel(null); } }, "Cancel")
            )
          )
        );
      })
    )
  );
}

function TopicView({ subject, color, topics, saveTopics, cards, saveCards, onBack, onStudy, onOpenTopic }) {
  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState("");
  const [confirmDel, setConfirmDel] = React.useState(null);

  const add = () => {
    if (!name.trim()) return;
    saveTopics(p => [...(p||[]), { id: uid(), subjectId: subject.id, name: name.trim(), created: today() }]);
    setName(""); setAdding(false);
  };
  const del = (id) => { saveTopics(p => (p||[]).filter(t => t.id !== id)); saveCards(p => (p||[]).filter(c => c.topicId !== id)); setConfirmDel(null); };

  return React.createElement("div", null,
    React.createElement("div", { style: { ...s.row, marginBottom:"1.5rem" } },
      React.createElement("button", { style: s.btn("ghost"), onClick: onBack }, "← Subjects"),
      React.createElement("span", { style: { fontWeight:500, fontSize:18, color } }, subject.name)
    ),
    React.createElement("div", { style: { ...s.row, justifyContent:"space-between", marginBottom:"1.25rem" } },
      React.createElement("span", { style: { color:"#aaa", fontSize:13 } }, `${topics.length} topic${topics.length!==1?"s":""}`),
      React.createElement("button", { style: s.btn("primary"), onClick: () => setAdding(a => !a) }, "+ New topic")
    ),
    adding && React.createElement("div", { style: { ...s.card, marginBottom:"1.25rem" } },
      React.createElement("div", { style: s.row },
        React.createElement("input", { style: { ...s.input, flex:1 }, placeholder:"Topic name…", value:name, onChange: e => setName(e.target.value), onKeyDown: e => e.key==="Enter" && add() }),
        React.createElement("button", { style: s.btn("primary"), onClick: add }, "Add"),
        React.createElement("button", { style: s.btn("ghost"), onClick: () => { setAdding(false); setName(""); } }, "Cancel")
      )
    ),
    topics.length === 0 && !adding && React.createElement("div", { style: { color:"#555", fontSize:14, textAlign:"center", marginTop:"2rem" } }, "No topics yet. Create one above."),
    React.createElement("div", { style: { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:12 } },
      topics.map(topic => {
        const topicCards = (cards||[]).filter(c => c.topicId === topic.id);
        return React.createElement("div", { key: topic.id, style: { ...s.noteCard, borderLeft:`3px solid ${color}`, position:"relative", cursor:"pointer" }, onClick: () => confirmDel !== topic.id && onOpenTopic(topic) },
          React.createElement("div", { style: { ...s.row, marginBottom:8 } },
            React.createElement("span", { style: { fontWeight:500, fontSize:15, flex:1 } }, topic.name),
            React.createElement("button", { style: s.del, onClick: e => { e.stopPropagation(); setConfirmDel(topic.id); } }, "×")
          ),
          React.createElement("div", { style: { fontSize:12, color:"#555", marginBottom: topicCards.length > 0 ? 10 : 0 } }, `${topicCards.length} card${topicCards.length!==1?"s":""}`),
          topicCards.length > 0 && React.createElement("button", { style: { ...s.btn("primary"), fontSize:12, width:"100%" }, onClick: e => { e.stopPropagation(); onStudy(topic); } }, "Study"),
          confirmDel === topic.id && React.createElement("div", { style: { position:"absolute", inset:0, background:"#0f0f13ee", borderRadius:12, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, padding:"1rem", zIndex:2 } },
            React.createElement("span", { style: { fontSize:13, color:"#f0f0f5", textAlign:"center" } }, `Delete "${topic.name}" and all its cards?`),
            React.createElement("div", { style: s.row },
              React.createElement("button", { style: { ...s.btn("primary"), background:"#a32d2d", borderColor:"#e24b4a" }, onClick: e => { e.stopPropagation(); del(topic.id); } }, "Delete"),
              React.createElement("button", { style: s.btn("ghost"), onClick: e => { e.stopPropagation(); setConfirmDel(null); } }, "Cancel")
            )
          )
        );
      })
    )
  );
}

function CardView({ topic, subject, color, cards, saveCards, onBack, onStudy }) {
  const [form, setForm] = React.useState({ front:"", back:"" });
  const [flipped, setFlipped] = React.useState({});
  const [confirmDel, setConfirmDel] = React.useState(null);

  const add = () => {
    if (!form.front.trim() || !form.back.trim()) return;
    saveCards(p => [...(p||[]), { id: uid(), topicId: topic.id, front: form.front.trim(), back: form.back.trim(), created: today() }]);
    setForm({ front:"", back:"" });
  };
  const del = (id) => { saveCards(p => (p||[]).filter(c => c.id !== id)); setConfirmDel(null); };
  const toggleFlip = (id) => setFlipped(p => ({ ...p, [id]: !p[id] }));

  return React.createElement("div", null,
    React.createElement("div", { style: { ...s.row, marginBottom:"1.5rem" } },
      React.createElement("button", { style: s.btn("ghost"), onClick: onBack }, `← ${subject ? subject.name : "Back"}`),
      React.createElement("span", { style: { fontWeight:500, fontSize:18, color } }, topic.name),
      cards.length > 0 && React.createElement("button", { style: { ...s.btn("primary"), marginLeft:"auto" }, onClick: onStudy }, `Study (${cards.length})`)
    ),
    React.createElement("div", { style: { ...s.card, marginBottom:"1.5rem" } },
      React.createElement("div", { style: { fontSize:13, fontWeight:500, color:"#aaa", marginBottom:10 } }, "New flashcard"),
      React.createElement("textarea", { style: { ...s.textarea, marginBottom:8 }, placeholder:"Front (question)…", value:form.front, onChange: e => setForm(p => ({ ...p, front:e.target.value })), rows:2 }),
      React.createElement("textarea", { style: { ...s.textarea, marginBottom:10 }, placeholder:"Back (answer)…", value:form.back, onChange: e => setForm(p => ({ ...p, back:e.target.value })), rows:2 }),
      React.createElement("button", { style: s.btn("primary"), onClick: add }, "Add card")
    ),
    cards.length === 0 && React.createElement("div", { style: { color:"#555", fontSize:14, textAlign:"center", marginTop:"2rem" } }, "No cards yet. Add one above."),
    React.createElement("div", { style: { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap:12 } },
      cards.map(c => {
        const isFlipped = !!flipped[c.id];
        return React.createElement("div", { key: c.id, style: { position:"relative" } },
          React.createElement("div", { onClick: () => toggleFlip(c.id), style: { background: isFlipped ? color+"22" : "#18181f", border:`0.5px solid ${isFlipped ? color+"66" : "#2e2e3a"}`, borderRadius:12, padding:"1.25rem 1.5rem", cursor:"pointer", minHeight:120, display:"flex", flexDirection:"column", justifyContent:"space-between" } },
            React.createElement("div", { style: { fontSize:11, color: isFlipped ? color : "#555", fontWeight:500, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" } }, isFlipped ? "Answer" : "Question"),
            React.createElement("div", { style: { fontSize:14, color:"#f0f0f5", lineHeight:1.6, flex:1 } }, isFlipped ? c.back : c.front),
            React.createElement("div", { style: { fontSize:11, color:"#333", marginTop:8, textAlign:"right" } }, "click to flip")
          ),
          React.createElement("button", { style: { ...s.del, position:"absolute", top:8, right:8, fontSize:14, zIndex:1 }, onClick: () => setConfirmDel(c.id) }, "×"),
          confirmDel === c.id && React.createElement("div", { style: { position:"absolute", inset:0, background:"#0f0f13ee", borderRadius:12, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, padding:"1rem", zIndex:2 } },
            React.createElement("span", { style: { fontSize:13, color:"#f0f0f5", textAlign:"center" } }, "Delete this card?"),
            React.createElement("div", { style: s.row },
              React.createElement("button", { style: { ...s.btn("primary"), background:"#a32d2d", borderColor:"#e24b4a" }, onClick: () => del(c.id) }, "Delete"),
              React.createElement("button", { style: s.btn("ghost"), onClick: () => setConfirmDel(null) }, "Cancel")
            )
          )
        );
      })
    )
  );
}

function StudyMode({ topic, cards, color, onExit }) {
  const [deck] = React.useState(() => [...cards].sort(() => Math.random() - 0.5));
  const [idx, setIdx] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [correct, setCorrect] = React.useState(0);
  const [incorrect, setIncorrect] = React.useState(0);
  const [done, setDone] = React.useState(false);

  const total = deck.length;
  const current = deck[idx];

  const answer = (isCorrect) => {
    if (isCorrect) setCorrect(p => p+1); else setIncorrect(p => p+1);
    if (idx+1 >= total) setDone(true);
    else { setIdx(p => p+1); setFlipped(false); }
  };
  const restart = () => { setIdx(0); setFlipped(false); setCorrect(0); setIncorrect(0); setDone(false); };

  if (!current && !done) return null;

  if (done) return React.createElement("div", null,
    React.createElement("div", { style: { ...s.row, marginBottom:"1.5rem" } },
      React.createElement("button", { style: s.btn("ghost"), onClick: onExit }, "← Back"),
      React.createElement("span", { style: { fontWeight:500, fontSize:18, color } }, `Results — ${topic.name}`)
    ),
    React.createElement("div", { style: { ...s.card, textAlign:"center", padding:"2.5rem 1.5rem" } },
      React.createElement("div", { style: { fontSize:40, fontWeight:500, marginBottom:8 } }, `${Math.round((correct/total)*100)}%`),
      React.createElement("div", { style: { fontSize:14, color:"#aaa", marginBottom:"1.5rem" } }, `${correct} correct · ${incorrect} incorrect · ${total} total`),
      React.createElement("div", { style: { display:"flex", gap:12, justifyContent:"center", marginBottom:"1.5rem" } },
        React.createElement("div", { style: { ...s.metricCard, textAlign:"center", minWidth:100 } }, React.createElement("div", { style: s.label }, "Correct"), React.createElement("div", { style: { fontSize:24, fontWeight:500, color:"#1d9e75" } }, correct)),
        React.createElement("div", { style: { ...s.metricCard, textAlign:"center", minWidth:100 } }, React.createElement("div", { style: s.label }, "Incorrect"), React.createElement("div", { style: { fontSize:24, fontWeight:500, color:"#e24b4a" } }, incorrect))
      ),
      React.createElement("div", { style: s.row },
        React.createElement("button", { style: s.btn("primary"), onClick: restart }, "Study again"),
        React.createElement("button", { style: s.btn("ghost"), onClick: onExit }, "Exit")
      )
    )
  );

  return React.createElement("div", null,
    React.createElement("div", { style: { ...s.row, marginBottom:"1.5rem" } },
      React.createElement("button", { style: s.btn("ghost"), onClick: onExit }, "← Exit"),
      React.createElement("span", { style: { fontWeight:500, fontSize:18, color } }, `Studying — ${topic.name}`)
    ),
    React.createElement("div", { style: { ...s.row, marginBottom:"1.25rem", gap:12 } },
      React.createElement("div", { style: s.metricCard }, React.createElement("div", { style: s.label }, "Progress"), React.createElement("div", { style: { fontSize:16, fontWeight:500 } }, `${idx+1} / ${total}`)),
      React.createElement("div", { style: s.metricCard }, React.createElement("div", { style: s.label }, "Correct"), React.createElement("div", { style: { fontSize:16, fontWeight:500, color:"#1d9e75" } }, correct)),
      React.createElement("div", { style: s.metricCard }, React.createElement("div", { style: s.label }, "Incorrect"), React.createElement("div", { style: { fontSize:16, fontWeight:500, color:"#e24b4a" } }, incorrect))
    ),
    React.createElement("div", { style: { height:6, background:"#1e1e2a", borderRadius:3, marginBottom:"1.5rem", overflow:"hidden" } },
      React.createElement("div", { style: { height:"100%", width:`${(idx/total)*100}%`, background:color, borderRadius:3, transition:"width 0.3s" } })
    ),
    React.createElement("div", { onClick: () => setFlipped(p => !p), style: { background: flipped ? color+"22" : "#18181f", border:`1px solid ${flipped ? color+"66" : "#2e2e3a"}`, borderRadius:16, padding:"2.5rem 2rem", cursor:"pointer", minHeight:200, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", marginBottom:"1.5rem" } },
      React.createElement("div", { style: { fontSize:12, color: flipped ? color : "#555", fontWeight:500, marginBottom:16, textTransform:"uppercase", letterSpacing:"0.08em" } }, flipped ? "Answer" : "Question — click to reveal answer"),
      React.createElement("div", { style: { fontSize:18, color:"#f0f0f5", lineHeight:1.7, maxWidth:500 } }, flipped ? current.back : current.front)
    ),
    flipped
      ? React.createElement("div", { style: { display:"flex", gap:12, justifyContent:"center" } },
          React.createElement("button", { style: { ...s.btn("primary"), background:"#0f6e56", borderColor:"#1d9e75", fontSize:15, padding:"0.6rem 2rem" }, onClick: () => answer(true) }, "Got it"),
          React.createElement("button", { style: { ...s.btn("primary"), background:"#a32d2d", borderColor:"#e24b4a", fontSize:15, padding:"0.6rem 2rem" }, onClick: () => answer(false) }, "Missed it")
        )
      : React.createElement("div", { style: { textAlign:"center", color:"#444", fontSize:13 } }, "click the card to reveal the answer")
  );
}
