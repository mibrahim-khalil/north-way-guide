import "./About.css";

// importing team member picture
import m1 from "../assets/images/team/member1.jpg";
import m2 from "../assets/images/team/member2.png";
import m3 from "../assets/images/team/member3.png";

const team = [
  {
    id: "ibrahim",
    name: "Muhammad Ibrahim Khalil",
    role: "Web Developer",
    photo: m1,
    bio: "Worked on system architecture, frontend Developement, backend development and APIs, and database design.",
    skills: ["MERN Stack", "Node", "React", "Python"],
    links: {
      github: "https://github.com/mibrahim-khalil",
      linkedin: "https://www.linkedin.com/in/muhammad-ibrahim-khalil-680b6526a/",
      email: "mailto:mibrahimkhalil564@email.com",
    },
  },
  {
    id: "uday", 
    name: "Sardar Uday Ali Babar",
    role: "Software Engineering Student",
    photo: m2,
    bio: "Worked on documentations, frontend UI, and database design.",
    skills: ["React", "Node", "MongoDB", "UI/UX"],
    links: {
      github: "#",
      linkedin: "#",
      email: "mailto:you@email.com",
    },
  },
  {
    id: "hunzala",
    name: "Hunzala Tahir",
    role: "Software Engineering Student",
    photo: m3,
    bio: "Worked on system architecture, frontend UI and database design.",
    skills: ["React", "Node", "MongoDB", "UI/UX"],
    links: {
      github: "#",
      linkedin: "#",
      email: "mailto:you@email.com",
    },
  },
];

const stats = [
  { value: "7+", label: "Modules" },
  { value: "RBAC", label: "Secure Roles" },
  { value: "GB", label: "Region Focus" },
  { value: "MERN", label: "Full Stack" },
];

export default function About() {
  return (
    <div className="aboutWrap">
      <section className="aboutIntro card">
        <div className="cardBody aboutIntroInner">
          <div>
            <span className="badge">North Way Guide</span>
            <h2 className="aboutTitle">Building the Digital Future of Tourism in Gilgit Baltistan</h2>
            <p className="p">
              North Way Guide is an AI-powered tourism and local services ecosystem
              designed to help travelers discover Gilgit-Baltistan through smart trip planning, verified
              local services, accommodations, transportation, and authentic regional experiences.
            </p>

            <div className="aboutCtas">
              <a className="btn primary" href="#team">Meet the Team</a>
              <a className="btn" href="#modules">Modules</a>
            </div>

            <div className="aboutStats">
              {stats.map((s) => (
                <div className="stat" key={s.label}>
                  <div className="statValue">{s.value}</div>
                  <div className="statLabel">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="aboutGlowCard">
            <div className="aboutGlowTitle">Why this project?</div>
            <p className="p">
              Gilgit-Baltistan has unmatched natural beauty and culture, but
              travelers still struggle with trusted information, route
              decisions, and verified local services.
            </p>
            <div className="aboutGlowList">
              <GlowItem title="Trust" text="Verified guides, vendors, and transparent reviews." />
              <GlowItem title="Planning" text="AI trip planning (Decision Tree) based on user constraints." />
              <GlowItem title="Cost" text="Fare comparison helps tourists choose smart options." />
            </div>
          </div>
        </div>
      </section>

      {/* Mission / Vision */}
      <section className="aboutGrid2">
        <div className="card">
          <div className="cardBody">
            <h3 className="aboutH3">Mission</h3>
            <p className="p">
              Empower travelers and local businesses through a modern, reliable, and
              intelligent tourism ecosystem built specifically for Gilgit-Baltistan.
            </p>
          </div>
        </div>
        <div className="card">
          <div className="cardBody">
            <h3 className="aboutH3">Vision</h3>
            <p className="p">
              To become the leading digital tourism platform of Northern Pakistan by connecting
              travelers with trusted experiences, local communities, and AI-driven travel assistance.
            </p>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="card">
        <div className="cardBody">
          <div className="aboutSectionTop">
            <h3 className="aboutH3" style={{ margin: 0 }}>Core Modules</h3>
          </div>

          <div className="moduleGrid">
            <ModuleCard title="Smart AI Trip Planner" desc="Decision Tree model (backend integration later)." />
            <ModuleCard title="Hotel Booking & Stays" desc="Top-rated stays, booking UI, room categories and details." />
            <ModuleCard title="Smart Transport Comparison" desc="Pickup/drop fare comparison with seasonal estimation." />
            <ModuleCard title="Destination Explorer" desc="Spot details with directions and rich info." />
            <ModuleCard title="Local Guides" desc="Hire guide workflow UI and ratings based discovery." />
            <ModuleCard title="Local Marketplace" desc="Order products UI + vendor/shop information." />
            <ModuleCard title="Management Dashboard" desc="RBAC, verification, approvals, and content control." />
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="card">
        <div className="cardBody">
          <div className="aboutSectionTop">
            <h3 className="aboutH3" style={{ margin: 0 }}>Meet the Team</h3>
            <span className="badge">Final Year Project</span>
          </div>

          <p className="p" style={{ marginTop: 10 }}>
            A dedicated team building a production-style system with modern web
            standards and region-focused impact.
          </p>

          <div className="teamGrid">
            {team.map((m) => (
              <div className="teamCard" key={m.id}>
                <div className="teamImgWrap">
                  <img className="teamImg" src={m.photo} alt={m.name} />
                </div>

                <div className="teamBody">
                  <div className="teamName">{m.name}</div>
                  <div className="teamRole">{m.role}</div>

                  <p className="p" style={{ fontSize: 13, marginTop: 8 }}>
                    {m.bio}
                  </p>

                  <div className="chipRow">
                    {m.skills.map((s) => (
                      <span className="chip" key={s}>{s}</span>
                    ))}
                  </div>

                  <div className="teamLinks">
                    <a className="btn ghost" href={m.links.github} target="_blank" rel="noreferrer">GitHub</a>
                    <a className="btn ghost" href={m.links.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
                    <a className="btn primary" href={m.links.email}>Email</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function GlowItem({ title, text }) {
  return (
    <div className="glowItem">
      <div className="glowTitle">{title}</div>
      <div className="p" style={{ fontSize: 13 }}>{text}</div>
    </div>
  );
}

function ModuleCard({ title, desc }) {
  return (
    <div className="moduleCard">
      <div className="moduleTitle">{title}</div>
      <div className="p" style={{ fontSize: 13 }}>{desc}</div>
    </div>
  );
}