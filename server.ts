import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("bcp.db");

// Initialize database
db.exec(`
  DROP TABLE IF EXISTS staff;
  
  CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    department TEXT,
    staff_info TEXT,
    remote_access INTEGER DEFAULT 0,
    problem_type TEXT,
    other_details TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS app_metadata (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`);

// Seed initial data if empty
const count = db.prepare("SELECT count(*) as count FROM staff").get() as { count: number };
if (count.count === 0) {
  const insert = db.prepare("INSERT INTO staff (name, department, staff_info) VALUES (?, ?, ?)");
  const dept = "საბანკო სერვისების განვითარების დეპარტამენტი";
  const initialStaff = [
    ["ანი გიორგაძე", dept, "A0314 | Ani.Giorgadze@lb.ge"],
    ["რუსუდანი ხაჟომია", dept, "B0713 | Rusudan.Khazhomia@lb.ge"],
    ["ხათუნა გიორგაძე", dept, "B0714 | Khato.Giorgadze@lb.ge"],
    ["თამთა ტომარაძე", dept, "A0962 | Tamta.Tomaradze@lb.ge"],
    ["ნინო ღუნაშვილი", dept, "A0621 | Nino.Gunashvili@lb.ge"],
    ["ელენე პეიტრიშვილი", dept, "A1023 | Elene.Peitrishvili@lb.ge"],
    ["თეონა ტუღუში", dept, "A0603 | Teona.Tugushi@lb.ge"],
    ["მარინა ტომოზოვა", dept, "A5351 | Marina.Tomozova@lb.ge"],
    ["ნათია წიკლაური", dept, "A0857 | Natia.Tsiklauri@lb.ge"],
    ["ნინო პიტიურიშვილი", dept, "A6411 | Nino.Pitiurishvili@lb.ge"],
    ["თამარი დეკანოიძე", dept, "A9719 | Tamar.Dekanoidze@lb.ge"],
    ["სოფიო კაპანაძე", dept, "B0513 | Sopio.Kapanadze@lb.ge"],
    ["ნინო ფერაძე", dept, "A9003 | Nino.Pheradze@lb.ge"],
    ["თინათინ ყორღანაშვილი", dept, "A8994 | Tinatin.Korghanashvili@lb.ge"],
    ["მარიკა მაკარიძე", dept, "B2735 | Marika.Makaridze@lb.ge"],
    ["ვალენტინა ნათენაძე", dept, "B2788 | Valentina.Natenadze@lb.ge"],
    ["თამარ როსტიაშვილი", dept, "B3774 | Tamar.Rostiashvili@lb.ge"],
    ["თეონა კაპანაძე", dept, "B5561 | T.Kapanadze@lb.ge"],
    ["ლია კიკვაძე", dept, "B5684 | Lika.Kikvadze@lb.ge"],
    ["თამარ კავლელაშვილი", dept, "B8707 | Tamar.Kavlelashvili@lb.ge"],
    ["პაატა შარიქაძე", dept, "A0324 | Paata.Sharikadze@lb.ge"],
    ["თეიმურაზ მდინარაძე", dept, "A0287 | Temuri.Mdinaradze@lb.ge"],
    ["სოფიკო თანიაშვილი", dept, "B9092 | Sophiko.Taniashvili@lb.ge"],
    ["ავთანდილ ყავრელიშვილი", dept, "B9144 | Avtandil.Kavrelishvi@lb.ge"],
    ["გიორგი კაკაშვილი", dept, "B9280 | Giorgi.Kakashvili@lb.ge"],
    ["ნიკოლოზ მეზვრიშვილი", dept, "B9830 | Nikoloz.Mezvrishvili@lb.ge"],
    ["გიორგი ძამაშვილი", dept, "C0142 | Giorgi.Dzamashvili@lb.ge"],
    ["ელენე მჭედლიძე", dept, "C0220 | Elene.Mchedlidze@lb.ge"],
    ["ხათუნა სურმანიძე", dept, "C0659 | Khatuna.Surmanidze@lb.ge"],
    ["ელენე ორჯონიკიძე", dept, "C1043 | Elene.Orjonikidze@lb.ge"],
    ["ვანო თინაშვილი", dept, "C1157 | Vano.Tinashvili@lb.ge"],
    ["მაია მოწონელიძე", dept, "C1326 | Maia.Motsonelidze@lb.ge"],
    ["ანა არველაძე", dept, "C1873 | Ana.Arvelაძე@lb.ge"],
    ["ხათუნა ჭიოკაძე", dept, "C2521 | Khatuna.Tchiokadze@lb.ge"],
    ["ნიკა რუხაძე", dept, "C3209 | Nika.Rukhadze@lb.ge"],
    ["თემური კორკოტაშვილი", dept, "C3352 | Temuri.Korkotashvili@lb.ge"],
    ["ირინა ვართანოვი", dept, "C3400 | Irina.Vartanova@lb.ge"],
    ["მეგი ახალკაცი", dept, "C3417 | Megi.Akhalkatsi@lb.ge"],
    ["დავითი კაკაშვილი", dept, "C3760 | Daviti.Kakashvili@lb.ge"],
    ["ნათია ჩხიკვაძე", dept, "C3781 | n.chkhikvadze@lb.ge"],
    ["ზურაბ წიკლაური", dept, "C3860 | Zurab.Tsiklauri@lb.ge"],
    ["შალვა გიგაური", dept, "C4392 | Shalva.Gigauri@lb.ge"],
    ["გოგა გაჩეჩილაძე", dept, "C4562 | Goga.Gachechiladze@lb.ge"],
    ["გიორგი ცისკაძე", dept, "C4564 | Giorgi.Tsiskadze@lb.ge"],
    ["ბაკურ სიხარულიძე", dept, "C4691 | Bakur.Sikharulidze@lb.ge"],
    ["დავით მამფორია", dept, "C4693 | Davit.Mamporia@lb.ge"],
    ["ფიქრია თეთრაშვილი", dept, "C4790 | Pikria.Tetrashvili@lb.ge"],
    ["ნიკა კლდიაშვილი", dept, "C4826 | Nika.Kldiashvili@lb.ge"],
    ["მარიამი კობახიძე", dept, "C4886 | Mariami.Kobakhidze@lb.ge"],
    ["მიხეილ სადრაძე", dept, "C4955 | Mikheil.Sadradze@lb.ge"],
    ["ვასილი პაპიაშვილი", dept, "C5332 | Vasil.Papiashvili@lb.ge"],
    ["ნინო ცხვედიანი", dept, "C5354 | Nino.Tskhvediani@lb.ge"],
    ["გიორგი ჭიღლაძე", dept, "C5400 | Giorgi.Chighladze@lb.ge"],
    ["ზვიად ჭანტურია", dept, "C5688 | Zviad.Tchanturia@lb.ge"],
    ["ბექა კაჭკაჭაშვილი", dept, "C5829 | B.Katchkatchashvili@lb.ge"],
    ["ლელა ხითარიშვილი", dept, "C5968 | Lela.Khitarishvili@lb.ge"],
    ["გიორგი მირზაშვილი", dept, "C5974 | Giorgi.Mirzashvili@lb.ge"],
    ["გიორგი შაქარაშვილი", dept, "C6047 | George.Shakarashvili@lb.ge"],
    ["საბა ჯაბაური", dept, "C6074 | Saba.Jabauri@lb.ge"],
    ["მზექალა არაბული", dept, "C6344 | Mzekala.Arabuli@lb.ge"],
    ["მარიამ შევარდნაძე", dept, "C6443 | Mariam.Shevardnadze@lb.ge"],
    ["გიორგი გელაშვილი", dept, "C6749 | Giorgi.Gelashvili@lb.ge"],
    ["ნუგზარი ამონაშვილი", dept, "C6817 | Nugzari.Amonashvili@lb.ge"],
    ["დავითი შადური", dept, "C6822 | Daviti.Shaduri@lb.ge"],
    ["ლევანი ფილფანი", dept, "C6823 | Levani.Pilpani@lb.ge"],
    ["ანა ცანავა", dept, "C6824 | Ana.Tsanava@lb.ge"],
    ["ჯემალ მოწყობილი", dept, "C7385 | Jemal.Motskobili@lb.ge"],
    ["ნანა მამულია", dept, "C8416 | Nana.Mamulia@lb.ge"],
    ["გურამ აფხაზავა", dept, "C8982 | Guram.Apkhazava@lb.ge"],
    ["რაისა ბადალოვა", dept, "C8983 | Raisa.Badalova@lb.ge"],
    ["გიორგი დანელია", dept, "C9021 | Giorgi.Danelia@lb.ge"],
    ["რამაზ ბლუაშვილი", dept, "C9104 | Ramaz.Bluashvili@lb.ge"],
    ["ანა თორია", dept, "C9129 | Ana.Toria@lb.ge"],
    ["ნათია მახათაძე", dept, "C9347 | Natia.Makhatadze@lb.ge"],
    ["ავრაამი ბადალოვი", dept, "C9606 | Avraami.Badalovi@lb.ge"],
    ["სოფიკო ჩიტაძე", dept, "C9638 | Sopiko.Chitadze@lb.ge"],
    ["დავითი გიორგაძე", dept, "D0025 | Daviti.Giorgadze@lb.ge"],
    ["სოფიო გვენეტაძე", dept, "D0026 | Sopio.Gvenetadze@lb.ge"],
    ["ნუგზარი როსტიაშვილი", dept, "D0352 | Nugzari.Rostiashvili@lb.ge"],
    ["ბაია დიდიშვილი", dept, "D0450 | Baia.Didishvili@lb.ge"],
    ["ნინელი ქოჩქიანი", dept, "D0728 | Nineli.Kochkiani@lb.ge"],
    ["გიორგი უჩანეიშვილი", dept, "D0763 | Giorgi.Uchaneishvili@lb.ge"],
    ["ზეზვა მებაღიშვილი", dept, "D1020 | Zezva.Mebagishvili@lb.ge"],
    ["ლევან მთივლიშვილი", dept, "levan.mtivlishvili@lb.ge"],
    ["გოდერძი ლომინეიშვილი", dept, "goderdzi.lomineishvili@lb.ge"],
    ["ბექა ნასუაშვილი", dept, "beka.nashuashvili@lb.ge"],
    ["მედეა გეორბელიძე", dept, "dea.georbelidze@lb.ge"],
    ["ნინო დევდარიანი", dept, "nino.devdariani@lb.ge"]
  ];
  for (const staff of initialStaff) {
    insert.run(staff[0], staff[1], staff[2]);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/staff", (req, res) => {
    const staff = db.prepare("SELECT * FROM staff ORDER BY department ASC, name ASC").all();
    const lastUpdate = db.prepare("SELECT value FROM app_metadata WHERE key = 'last_global_update'").get() as { value: string } | undefined;
    res.json({ staff, lastUpdate: lastUpdate?.value || null });
  });

  app.post("/api/staff/:id/status", (req, res) => {
    const { id } = req.params;
    const { remote_access, problem_type, other_details } = req.body;

    const now = new Date().toISOString();

    const updateStaff = db.prepare(`
      UPDATE staff 
      SET remote_access = ?, 
          problem_type = ?, 
          other_details = ?, 
          updated_at = ? 
      WHERE id = ?
    `);

    const updateMetadata = db.prepare(`
      INSERT OR REPLACE INTO app_metadata (key, value) VALUES ('last_global_update', ?)
    `);

    const transaction = db.transaction(() => {
      updateStaff.run(remote_access ? 1 : 0, problem_type || null, other_details || null, now, id);
      updateMetadata.run(now);
    });

    try {
      transaction();
      res.json({ success: true, lastUpdate: now });
    } catch (err) {
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  app.post("/api/staff/bulk-verify", (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No IDs provided" });
    }

    const now = new Date().toISOString();
    
    // We'll set problem_type to 'verification_requested' or similar
    // Actually, the user said "change status so employee can verify". 
    // I'll set remote_access to 0 and problem_type to 'verification_requested'
    const updateStaff = db.prepare(`
      UPDATE staff 
      SET remote_access = 0, 
          problem_type = 'verification_requested', 
          other_details = 'IT Support has fixed the issue. Please verify access.', 
          updated_at = ? 
      WHERE id = ?
    `);

    const updateMetadata = db.prepare(`
      INSERT OR REPLACE INTO app_metadata (key, value) VALUES ('last_global_update', ?)
    `);

    const transaction = db.transaction(() => {
      for (const id of ids) {
        updateStaff.run(now, id);
      }
      updateMetadata.run(now);
    });

    try {
      transaction();
      res.json({ success: true, lastUpdate: now });
    } catch (err) {
      res.status(500).json({ error: "Failed to update statuses" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
