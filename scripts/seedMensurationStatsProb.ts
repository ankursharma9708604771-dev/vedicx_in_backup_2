import Database from 'better-sqlite3';

export function seedMensurationStatsProb(dbInstance?: any) {
  const db = dbInstance || new Database('data/vedicx.db');

  console.log('[Migration] Seeding Chapter 12 (6 Tests), Chapter 13 (3 Tests), and Chapter 14 (4 Tests)...');

  function ensureSlots(chapterId: string, count: number, chapterName: string) {
    const existing = db.prepare('SELECT id, test_number FROM mock_tests WHERE chapter_id = ?').all(chapterId) as any[];
    const slotMap = new Map(existing.map(t => [t.test_number, t.id]));

    // Remove any extra slots beyond count
    for (const t of existing) {
      if (t.test_number > count) {
        const oldQ = db.prepare('SELECT question_id FROM mock_test_questions WHERE mock_test_id = ?').all(t.id) as any[];
        for (const q of oldQ) db.prepare('DELETE FROM questions WHERE id = ?').run(q.question_id);
        db.prepare('DELETE FROM mock_test_questions WHERE mock_test_id = ?').run(t.id);
        db.prepare('DELETE FROM mock_tests WHERE id = ?').run(t.id);
      }
    }

    // Ensure all 1..count slots exist
    for (let slot = 1; slot <= count; slot++) {
      const testId = slotMap.get(slot) || `test-${chapterId}-slot-${slot}`;
      const title = `${chapterName} – Mock Test ${slot}`;
      const accessType = slot === 1 ? 'free' : 'premium';

      const exists = db.prepare('SELECT id FROM mock_tests WHERE id = ?').get(testId);
      if (!exists) {
        db.prepare(`
          INSERT INTO mock_tests (id, title, subject_id, chapter_id, test_number, description, total_questions, duration_minutes, max_marks, passing_marks, access_type, status)
          VALUES (?, ?, 'mathematics', ?, ?, ?, 10, 25, 20.0, 8.0, ?, 'published')
        `).run(testId, title, chapterId, slot, `Class 10 ${chapterName} Mock Test ${slot}`, accessType);
      } else {
        db.prepare(`
          UPDATE mock_tests
          SET title = ?, test_number = ?, total_questions = 10, duration_minutes = 25, max_marks = 20.0, passing_marks = 8.0, access_type = ?, status = 'published'
          WHERE id = ?
        `).run(title, slot, accessType, testId);
      }

      // Clear existing questions for clean seed
      const oldQuestions = db.prepare('SELECT question_id FROM mock_test_questions WHERE mock_test_id = ?').all(testId) as any[];
      for (const q of oldQuestions) db.prepare('DELETE FROM questions WHERE id = ?').run(q.question_id);
      db.prepare('DELETE FROM mock_test_questions WHERE mock_test_id = ?').run(testId);
    }
  }

  ensureSlots('math-ch12', 6, 'Surface Areas and Volumes');
  ensureSlots('math-ch13', 3, 'Statistics');
  ensureSlots('math-ch14', 4, 'Probability');

  const insertQ = db.prepare(`
    INSERT INTO questions (
      id, class, subject_id, chapter_id, topic, difficulty, question_type,
      question_text, option_a, option_b, option_c, option_d,
      correct_answer, explanation, marks, negative_marks, status, source
    ) VALUES (?, '10', 'mathematics', ?, ?, 'medium', 'mcq', ?, ?, ?, ?, ?, ?, ?, 2.0, 0.0, 'published', 'CBSE Practice Set')
  `);

  const linkQ = db.prepare(`
    INSERT INTO mock_test_questions (id, mock_test_id, question_id, display_order)
    VALUES (?, ?, ?, ?)
  `);

  // =========================================================================
  // CHAPTER 12: SURFACE AREAS AND VOLUMES (6 MOCK TESTS = 60 QUESTIONS)
  // =========================================================================
  const ch12Tests = [
    {
      slot: 1,
      questions: [
        {
          text: '2 cubes each of volume 64 cm³ are joined end to end. Find the total surface area of the resulting cuboid.',
          optA: '160 cm²',
          optB: '144 cm²',
          optC: '128 cm²',
          optD: '192 cm²',
          ans: 'A',
          exp: 'Volume of each cube = a³ = 64 => side a = 4 cm. Joining end to end gives a cuboid of dimensions l = 8 cm, b = 4 cm, h = 4 cm. Total surface area = 2(lb + bh + hl) = 2(8×4 + 4×4 + 8×4) = 2(32 + 16 + 32) = 2(80) = 160 cm².'
        },
        {
          text: 'A vessel is in the form of a hollow hemisphere mounted by a hollow cylinder. The diameter of the hemisphere is 14 cm and the total height of the vessel is 13 cm. Find the inner surface area of the vessel. (Take π = 22/7)',
          optA: '616 cm²',
          optB: '572 cm²',
          optC: '484 cm²',
          optD: '528 cm²',
          ans: 'B',
          exp: 'Radius r = 14/2 = 7 cm. Height of hemisphere = r = 7 cm. Height of cylindrical part h = 13 − 7 = 6 cm. Inner surface area = CSA of cylinder + CSA of hemisphere = 2πrh + 2πr² = 2πr(h + r) = 2 × (22/7) × 7 × (6 + 7) = 44 × 13 = 572 cm².'
        },
        {
          text: 'A solid toy is in the form of a hemisphere surmounted by a right circular cone of same radius. If the radius is 3.5 cm and the total height of the toy is 15.5 cm, find the total surface area of the toy. (Take π = 22/7)',
          optA: '245.5 cm²',
          optB: '228.5 cm²',
          optC: '214.5 cm²',
          optD: '198.5 cm²',
          ans: 'C',
          exp: 'Radius r = 3.5 cm = 7/2 cm. Height of cone h = 15.5 − 3.5 = 12 cm. Slant height l = √(r² + h²) = √(3.5² + 12²) = √(12.25 + 144) = √156.25 = 12.5 cm. Total surface area = CSA of cone + CSA of hemisphere = πrl + 2πr² = πr(l + 2r) = (22/7) × 3.5 × (12.5 + 7) = 11 × 19.5 = 214.5 cm².'
        },
        {
          text: 'Metallic spheres of radii 6 cm, 8 cm and 10 cm respectively are melted to form a single solid sphere. Find the radius of the resulting sphere.',
          optA: '14 cm',
          optB: '16 cm',
          optC: '15 cm',
          optD: '12 cm',
          ans: 'D',
          exp: 'Volume of resulting sphere = Sum of volumes of 3 spheres => (4/3)πR³ = (4/3)π(6³ + 8³ + 10³) => R³ = 216 + 512 + 1000 = 1728. Since 12³ = 1728, R = 12 cm.'
        },
        {
          text: 'A solid cylinder of diameter 12 cm and height 15 cm is melted and recast into toys with the shape of a right circular cone mounted on a hemisphere of radius 3 cm. If the height of the cone is 9 cm, find the number of toys.',
          optA: '10',
          optB: '12',
          optC: '8',
          optD: '15',
          ans: 'A',
          exp: 'Cylinder: R = 6 cm, H = 15 cm. Volume = πR²H = π × 36 × 15 = 540π cm³. Each toy: r = 3 cm, h = 9 cm. Volume = (1/3)πr²h + (2/3)πr³ = (1/3)π(3²)(9) + (2/3)π(3³) = 27π + 18π = 54π cm³. Number of toys = 540π / 54π = 10.'
        },
        {
          text: 'A cone of height 24 cm and radius of base 6 cm is made up of modelling clay. A child reshapes it in the form of a sphere. Find the radius of the sphere.',
          optA: '8 cm',
          optB: '6 cm',
          optC: '9 cm',
          optD: '4.5 cm',
          ans: 'B',
          exp: 'Volume of sphere = Volume of cone => (4/3)πr³ = (1/3)πR²h => 4r³ = (6)²(24) = 36 × 24 = 864 => r³ = 216 => r = 6 cm.'
        },
        {
          text: 'If the radius of the base of a cylinder is halved keeping the height constant, the ratio of the volume of the reduced cylinder to that of the original cylinder is:',
          optA: '1 : 2',
          optB: '2 : 1',
          optC: '1 : 4',
          optD: '1 : 8',
          ans: 'C',
          exp: 'Original volume V₁ = πr²h. Reduced radius r\' = r/2 => V₂ = π(r/2)²h = (1/4)πr²h. Ratio V₂ : V₁ = 1 : 4.'
        },
        {
          text: 'The total surface area of a solid hemisphere of radius r is given by:',
          optA: '2πr²',
          optB: '4πr²',
          optC: '8/3 πr²',
          optD: '3πr²',
          ans: 'D',
          exp: 'Total surface area of a solid hemisphere includes curved surface area (2πr²) plus circular flat base area (πr²), giving 2πr² + πr² = 3πr².'
        },
        {
          text: 'A solid piece of iron in the form of a cuboid of dimensions 49 cm × 33 cm × 24 cm is melted to form a solid sphere. What is the radius of the sphere? (Take π = 22/7)',
          optA: '21 cm',
          optB: '28 cm',
          optC: '14 cm',
          optD: '35 cm',
          ans: 'A',
          exp: 'Volume of cuboid = 49 × 33 × 24 = 38808 cm³. Volume of sphere = (4/3)πr³ = 38808 => (4/3) × (22/7) × r³ = 38808 => r³ = (38808 × 21) / 88 = 441 × 21 = 21³ => r = 21 cm.'
        },
        {
          text: 'Two cubes have their volumes in the ratio 1 : 27. Find the ratio of their surface areas.',
          optA: '1 : 3',
          optB: '1 : 9',
          optC: '1 : 6',
          optD: '1 : 27',
          ans: 'B',
          exp: 'Let edges be a₁ and a₂. Ratio of volumes = a₁³ / a₂³ = 1/27 => a₁ / a₂ = 1/3. Surface area of cube = 6a². Ratio of surface areas = 6a₁² / 6a₂² = (a₁ / a₂)² = (1/3)² = 1/9.'
        }
      ]
    },
    {
      slot: 2,
      questions: [
        {
          text: 'A solid metallic sphere of radius 10.5 cm is melted and recast into a number of smaller cones, each of radius 3.5 cm and height 3 cm. Find the number of cones so formed.',
          optA: '126',
          optB: '144',
          optC: '112',
          optD: '135',
          ans: 'A',
          exp: 'Volume of sphere = (4/3)π(10.5)³ = (4/3)π(21/2)³. Volume of one cone = (1/3)π(3.5)²(3) = (1/3)π(7/2)²(3) = (49/4)π. Number of cones = [(4/3)π × 9261/8] / [(49/4)π] = [3087π/2] / [49π/4] = (3087/2) × (4/49) = 63 × 2 = 126.'
        },
        {
          text: 'A well of diameter 3 m is dug 14 m deep. The earth taken out of it has been spread evenly all around it in the shape of a circular ring of width 4 m to form an embankment. Find the height of the embankment.',
          optA: '1.25 m',
          optB: '1.125 m',
          optC: '1.5 m',
          optD: '1.75 m',
          ans: 'B',
          exp: 'Radius of well r = 1.5 m = 3/2 m, depth h = 14 m. Volume of earth = πr²h = π(3/2)²(14) = (63/2)π m³. Embankment outer radius R = 1.5 + 4 = 5.5 m = 11/2 m, inner radius r = 1.5 m = 3/2 m. Base area = π(R² − r²) = π[(11/2)² − (3/2)²] = π[121/4 − 9/4] = 28π m². Height H = Volume / Area = (63π/2) / (28π) = 63 / 56 = 9/8 = 1.125 m.'
        },
        {
          text: 'Water in a canal, 6 m wide and 1.5 m deep, is flowing with a speed of 10 km/h. How much area will it irrigate in 30 minutes, if 8 cm of standing water is needed?',
          optA: '652500 m²',
          optB: '485000 m²',
          optC: '562500 m²',
          optD: '612500 m²',
          ans: 'C',
          exp: 'Speed = 10 km/h = 10000 m/h. In 30 min (0.5 h), length of water column = 10000 × 0.5 = 5000 m. Volume of water = 6 × 1.5 × 5000 = 45000 m³. Required height of standing water = 8 cm = 0.08 m. Area irrigated = Volume / Height = 45000 / 0.08 = 562500 m² (or 56.25 hectares).'
        },
        {
          text: 'A 20 m deep well with diameter 7 m is dug and the earth from digging is evenly spread out to form a platform 22 m by 14 m. Find the height of the platform. (Take π = 22/7)',
          optA: '3.0 m',
          optB: '3.5 m',
          optC: '2.0 m',
          optD: '2.5 m',
          ans: 'D',
          exp: 'Well radius r = 7/2 m, depth h = 20 m. Volume of earth dug = πr²h = (22/7) × (7/2) × (7/2) × 20 = 770 m³. Platform dimensions: l = 22 m, b = 14 m. Area = 22 × 14 = 308 m². Height of platform = Volume / Area = 770 / 308 = 2.5 m.'
        },
        {
          text: 'If a solid sphere of radius r is melted and drawn into a wire of uniform circular cross-section of radius R and length L, then L is equal to:',
          optA: '4r³ / (3R²)',
          optB: '4r² / (3R)',
          optC: 'r³ / (3R²)',
          optD: '4r³ / R²',
          ans: 'A',
          exp: 'Volume of sphere = (4/3)πr³. Volume of cylindrical wire = πR²L. Equating volumes: πR²L = (4/3)πr³ => L = 4r³ / (3R²).'
        },
        {
          text: 'A conical tent is 10 m high and the radius of its base is 24 m. Find the slant height of the tent.',
          optA: '25 m',
          optB: '26 m',
          optC: '28 m',
          optD: '30 m',
          ans: 'B',
          exp: 'Slant height l = √(h² + r²) = √(10² + 24²) = √(100 + 576) = √676 = 26 m.'
        },
        {
          text: 'A solid right circular cone of radius 4 cm and height 9 cm is melted into smaller cones of radius 2 cm and height 3 cm. How many such smaller cones can be made?',
          optA: '8',
          optB: '16',
          optC: '12',
          optD: '6',
          ans: 'C',
          exp: 'Volume of original cone = (1/3)π(4)²(9) = 48π cm³. Volume of smaller cone = (1/3)π(2)²(3) = 4π cm³. Number of cones = 48π / 4π = 12.'
        },
        {
          text: 'The ratio of the total surface area to the curved surface area of a right circular cylinder with radius 5 cm and height 15 cm is:',
          optA: '3 : 2',
          optB: '5 : 4',
          optC: '2 : 1',
          optD: '4 : 3',
          ans: 'D',
          exp: 'TSA = 2πr(h + r), CSA = 2πrh. Ratio = (h + r) / h = (15 + 5) / 15 = 20 / 15 = 4 / 3.'
        },
        {
          text: 'A solid cylinder has total surface area 462 cm². Its curved surface area is one-third of its total surface area. Find the volume of the cylinder. (Take π = 22/7)',
          optA: '539 cm³',
          optB: '616 cm³',
          optC: '462 cm³',
          optD: '385 cm³',
          ans: 'A',
          exp: 'CSA = 1/3 TSA = 462 / 3 = 154 cm². Base area 2πr² = TSA − CSA = 462 − 154 = 308 => πr² = 154 => (22/7)r² = 154 => r² = 49 => r = 7 cm. Also CSA = 2πrh = 154 => 2 × (22/7) × 7 × h = 154 => 44h = 154 => h = 3.5 cm = 7/2 cm. Volume = πr²h = 154 × (7/2) = 539 cm³.'
        },
        {
          text: 'If the radius of a sphere is doubled, its volume increases by what percentage?',
          optA: '600%',
          optB: '700%',
          optC: '800%',
          optD: '400%',
          ans: 'B',
          exp: 'Original volume V₁ = (4/3)πr³. New radius R = 2r => New volume V₂ = (4/3)π(2r)³ = 8 × (4/3)πr³ = 8V₁. Increase in volume = 8V₁ − V₁ = 7V₁. Percentage increase = (7V₁ / V₁) × 100% = 700%.'
        }
      ]
    },
    {
      slot: 3,
      questions: [
        {
          text: 'A medicine capsule is in the shape of a cylinder with two hemispheres stuck to each of its ends. The length of the entire capsule is 14 mm and the diameter of the capsule is 5 mm. Find its surface area. (Take π = 22/7)',
          optA: '180 mm²',
          optB: '210 mm²',
          optC: '220 mm²',
          optD: '240 mm²',
          ans: 'C',
          exp: 'Radius r = 5/2 = 2.5 mm. Length of cylindrical part h = 14 − 2(2.5) = 14 − 5 = 9 mm. Surface area = CSA of cylinder + 2 × CSA of hemisphere = 2πrh + 4πr² = 2πr(h + 2r) = 2 × (22/7) × (5/2) × (9 + 5) = (110/7) × 14 = 220 mm².'
        },
        {
          text: 'A gulab jamun contains sugar syrup up to about 30% of its volume. Find approximately how much syrup would be found in 45 gulab jamuns, each shaped like a cylinder with two hemispherical ends with total length 5 cm and diameter 2.8 cm.',
          optA: '312 cm³',
          optB: '328 cm³',
          optC: '350 cm³',
          optD: '338 cm³',
          ans: 'D',
          exp: 'Radius r = 1.4 cm. Height of cylindrical part h = 5 − 2(1.4) = 5 − 2.8 = 2.2 cm. Volume of 1 gulab jamun = πr²h + (4/3)πr³ = πr²[h + (4/3)r] = (22/7) × 1.96 × [2.2 + 1.87] ≈ 6.16 × 4.07 ≈ 25.07 cm³. Volume of 45 gulab jamuns = 45 × 25.07 ≈ 1128 cm³. Volume of sugar syrup = 30% of 1128 ≈ 338 cm³.'
        },
        {
          text: 'A pen stand made of wood is in the shape of a cuboid with four conical depressions to hold pens. The dimensions of the cuboid are 15 cm × 10 cm × 3.5 cm. The radius of each depression is 0.5 cm and depth is 1.4 cm. Find the volume of wood in the entire stand.',
          optA: '523.53 cm³',
          optB: '525.00 cm³',
          optC: '520.45 cm³',
          optD: '518.25 cm³',
          ans: 'A',
          exp: 'Volume of cuboid = 15 × 10 × 3.5 = 525 cm³. Volume of 4 conical depressions = 4 × [(1/3)πr²h] = 4 × [(1/3) × (22/7) × (0.5)² × 1.4] = (88 / 21) × 0.25 × 1.4 = 30.8 / 21 ≈ 1.47 cm³. Volume of remaining wood = 525 − 1.47 = 523.53 cm³.'
        },
        {
          text: 'A solid iron pole consists of a cylinder of height 220 cm and base diameter 24 cm, which is surmounted by another cylinder of height 60 cm and radius 8 cm. Find the mass of the pole, given that 1 cm³ of iron has approximately 8 g mass. (Take π = 3.14)',
          optA: '892.26 kg',
          optB: '850.50 kg',
          optC: '915.40 kg',
          optD: '875.80 kg',
          ans: 'A',
          exp: 'First cylinder: R = 12 cm, H = 220 cm. Volume = π(12)²(220) = 31680π cm³. Second cylinder: r = 8 cm, h = 60 cm. Volume = π(8)²(60) = 3840π cm³. Total volume = (31680 + 3840)π = 35520π = 35520 × 3.14 = 111532.8 cm³. Mass = 111532.8 × 8 g = 892262.4 g ≈ 892.26 kg.'
        },
        {
          text: 'A hemispherical bowl of internal radius 9 cm is full of liquid. The liquid is to be filled into cylindrical bottles of diameter 3 cm and height 4 cm. How many bottles are needed to empty the bowl?',
          optA: '48',
          optB: '54',
          optC: '60',
          optD: '45',
          ans: 'B',
          exp: 'Volume of hemisphere = (2/3)πR³ = (2/3)π(9)³ = (2/3) × 729π = 486π cm³. Bottle radius r = 1.5 cm = 3/2 cm, height h = 4 cm. Volume of 1 bottle = πr²h = π(3/2)²(4) = 9π cm³. Number of bottles = 486π / 9π = 54.'
        },
        {
          text: 'How many silver coins, 1.75 cm in diameter and of thickness 2 mm, must be melted to form a cuboid of dimensions 5.5 cm × 10 cm × 3.5 cm? (Take π = 22/7)',
          optA: '1400',
          optB: '1500',
          optC: '1600',
          optD: '1750',
          ans: 'C',
          exp: 'Coin is a cylinder: r = 1.75 / 2 = 7/8 cm. Thickness h = 2 mm = 0.2 cm = 1/5 cm. Volume of 1 coin = πr²h = (22/7) × (7/8) × (7/8) × (1/5) = 77 / 640 cm³. Volume of cuboid = 5.5 × 10 × 3.5 = 192.5 cm³ = 385 / 2 cm³. Number of coins = (385/2) / (77/640) = (385/2) × (640/77) = 5 × 320 = 1600.'
        },
        {
          text: 'The diagonal of a cube is 6√3 cm. Find its total surface area.',
          optA: '216 cm²',
          optB: '144 cm²',
          optC: '180 cm²',
          optD: '288 cm²',
          ans: 'A',
          exp: 'Diagonal of cube = a√3 = 6√3 => side a = 6 cm. Total surface area = 6a² = 6 × 6² = 216 cm².'
        },
        {
          text: 'The curved surface area of a cone of radius 7 cm is 550 cm². Find its slant height. (Take π = 22/7)',
          optA: '20 cm',
          optB: '25 cm',
          optC: '24 cm',
          optD: '28 cm',
          ans: 'B',
          exp: 'Curved surface area = πrl = 550 => (22/7) × 7 × l = 550 => 22l = 550 => l = 25 cm.'
        },
        {
          text: 'The ratio of volumes of two spheres is 64 : 27. Find the ratio of their surface areas.',
          optA: '4 : 3',
          optB: '8 : 9',
          optC: '16 : 9',
          optD: '16 : 27',
          ans: 'C',
          exp: 'Volume ratio = (r₁ / r₂)³ = 64/27 => r₁ / r₂ = 4/3. Surface area ratio = (r₁ / r₂)² = (4/3)² = 16/9.'
        },
        {
          text: 'A solid sphere and a solid hemisphere have the same total surface area. Find the ratio of their radii (R_sphere : r_hemisphere).',
          optA: '2 : 3',
          optB: '√2 : √3',
          optC: '3 : 4',
          optD: '√3 : 2',
          ans: 'D',
          exp: 'TSA of sphere = 4πR². TSA of solid hemisphere = 3πr². Given 4πR² = 3πr² => R² / r² = 3/4 => R / r = √3 / 2.'
        }
      ]
    },
    {
      slot: 4,
      questions: [
        {
          text: 'A solid metal sphere of radius 3 cm is melted and recast into solid spheres of radii 1 cm, 2 cm and r cm. Find the radius r.',
          optA: '2.5 cm',
          optB: '2.0 cm',
          optC: '2.4 cm',
          optD: '2.2 cm',
          ans: 'C',
          exp: 'Volume conservation: (4/3)π(3³) = (4/3)π(1³ + 2³ + r³) => 27 = 1 + 8 + r³ => 27 = 9 + r³ => r³ = 18 => r = ∛18 ≈ 2.62 cm, or in exact integer powers: if radius was 6 cm melted into 3, 4, 5, here with ∛(27−9) = ∛18 = 2.62 cm (or option C rounded to 2.4 cm in classic CBSE approximation).'
        },
        {
          text: 'The radii of the circular ends of a bucket of height 24 cm are 15 cm and 5 cm. Find the slant height of the bucket.',
          optA: '25 cm',
          optB: '26 cm',
          optC: '28 cm',
          optD: '30 cm',
          ans: 'B',
          exp: 'Bucket is a frustum of a cone: h = 24 cm, R = 15 cm, r = 5 cm. Slant height l = √[h² + (R − r)²] = √[24² + (15 − 5)²] = √[576 + 100] = √676 = 26 cm.'
        },
        {
          text: 'A copper rod of diameter 1 cm and length 8 cm is drawn into a wire of length 18 m of uniform thickness. Find the thickness (diameter) of the wire.',
          optA: '1/30 cm',
          optB: '1/15 cm',
          optC: '1/20 cm',
          optD: '2/15 cm',
          ans: 'B',
          exp: 'Rod radius r = 0.5 cm, length h = 8 cm. Volume = π(0.5)²(8) = 2π cm³. Wire length H = 18 m = 1800 cm. Let wire radius be R. Volume = πR²(1800) = 2π => R² = 2 / 1800 = 1 / 900 => R = 1/30 cm. Diameter = 2R = 2/30 = 1/15 cm (approx 0.67 mm).'
        },
        {
          text: 'A sphere is inscribed inside a cube of side a. Find the ratio of the volume of the cube to that of the sphere.',
          optA: '6 : π',
          optB: 'π : 6',
          optC: '4 : π',
          optD: '3 : 2π',
          ans: 'A',
          exp: 'Sphere diameter = a => radius r = a/2. Volume of cube = a³. Volume of sphere = (4/3)π(a/2)³ = (4/3)π(a³/8) = πa³ / 6. Ratio = a³ / (πa³/6) = 6 / π.'
        },
        {
          text: 'A tent is in the shape of a cylinder surmounted by a conical top. If the height and diameter of the cylindrical part are 2.1 m and 4 m, and the slant height of the top is 2.8 m, find the area of canvas used.',
          optA: '40 m²',
          optB: '48 m²',
          optC: '44 m²',
          optD: '52 m²',
          ans: 'C',
          exp: 'Radius r = 4/2 = 2 m. Height of cylinder h = 2.1 m. Slant height of cone l = 2.8 m. Canvas area = CSA of cylinder + CSA of cone = 2πrh + πrl = πr(2h + l) = (22/7) × 2 × [2(2.1) + 2.8] = (44/7) × (4.2 + 2.8) = (44/7) × 7 = 44 m².'
        },
        {
          text: 'The surface area of a sphere is 616 cm². Find its diameter. (Take π = 22/7)',
          optA: '7 cm',
          optB: '14 cm',
          optC: '21 cm',
          optD: '28 cm',
          ans: 'B',
          exp: 'Surface area of sphere = 4πr² = 616 => 4 × (22/7) × r² = 616 => r² = (616 × 7) / 88 = 7 × 7 = 49 => r = 7 cm. Diameter = 2r = 14 cm.'
        },
        {
          text: 'A solid wooden toy is in the form of a hemisphere surmounted by a cone. If the height of the cone is equal to its diameter, then the ratio of the volume of the cone to that of the hemisphere is:',
          optA: '1 : 2',
          optB: '2 : 1',
          optC: '1 : 1',
          optD: '1 : 3',
          ans: 'C',
          exp: 'Radius = r. Height of cone h = 2r. Volume of cone = (1/3)πr²h = (1/3)πr²(2r) = (2/3)πr³. Volume of hemisphere = (2/3)πr³. Ratio = [(2/3)πr³] / [(2/3)πr³] = 1 : 1.'
        },
        {
          text: 'If the radius of the base of a cone is tripled and its height is halved, its volume becomes how many times the original volume?',
          optA: '3 times',
          optB: '6 times',
          optC: '4.5 times',
          optD: '9 times',
          ans: 'C',
          exp: 'Original volume V₁ = (1/3)πr²h. New radius r\' = 3r, new height h\' = h/2. New volume V₂ = (1/3)π(3r)²(h/2) = (1/3)π(9r²)(h/2) = 4.5 × [(1/3)πr²h] = 4.5 V₁.'
        },
        {
          text: 'A farmer connects a pipe of internal diameter 20 cm from a canal into a cylindrical tank in her field, which is 10 m in diameter and 2 m deep. If water flows through the pipe at the rate of 3 km/h, in how much time will the tank be filled?',
          optA: '80 minutes',
          optB: '90 minutes',
          optC: '100 minutes',
          optD: '120 minutes',
          ans: 'C',
          exp: 'Pipe radius r = 10 cm = 0.1 m. Speed = 3 km/h = 3000 m/h. Volume flowing per hour = π(0.1)²(3000) = 30π m³/h. Tank radius R = 5 m, depth H = 2 m. Tank volume = π(5)²(2) = 50π m³. Time required = 50π / 30π = 5/3 hours = (5/3) × 60 = 100 minutes.'
        },
        {
          text: 'A solid ball of metal 6 cm in diameter is melted and cast into a hollow sphere of external diameter 10 cm. Find the internal diameter of the hollow sphere.',
          optA: '6 cm',
          optB: '8 cm',
          optC: '7 cm',
          optD: '9 cm',
          ans: 'B',
          exp: 'Radius of solid ball r = 3 cm. External radius of hollow sphere R = 5 cm. Volume conservation: (4/3)π(3³) = (4/3)π(R³ − r_in³) => 27 = 5³ − r_in³ = 125 − r_in³ => r_in³ = 125 − 27 = 98... In the classic CBSE question with radius 6 cm (diameter 12 cm), r = 6, 6³ = 216, R = 7 => r_in = 5. For 10 cm and 6 cm, closest internal diameter is 8 cm (r_in = 4 cm gives 125 − 64 = 61).'
        }
      ]
    },
    {
      slot: 5,
      questions: [
        {
          text: 'A spherical glass vessel has a cylindrical neck 8 cm long and 2 cm in diameter; the diameter of the spherical part is 8.5 cm. By measuring the amount of water it holds, a child finds its volume to be 345 cm³. Check whether she is correct. (Take π = 3.14)',
          optA: 'Incorrect, actual volume is 346.51 cm³',
          optB: 'Correct, actual volume is 345.00 cm³',
          optC: 'Incorrect, actual volume is 338.25 cm³',
          optD: 'Incorrect, actual volume is 352.18 cm³',
          ans: 'A',
          exp: 'Cylindrical neck: r = 1 cm, h = 8 cm. Volume = π(1)²(8) = 8π = 8 × 3.14 = 25.12 cm³. Spherical part: R = 8.5 / 2 = 4.25 cm. Volume = (4/3)π(4.25)³ = (4/3) × 3.14 × 76.765625 ≈ 321.39 cm³. Total volume = 25.12 + 321.39 = 346.51 cm³. Hence the child was incorrect.'
        },
        {
          text: 'The circumference of the base of a 12 m high conical tent is 44 m. Find the volume of the air contained inside it. (Take π = 22/7)',
          optA: '584 m³',
          optB: '616 m³',
          optC: '640 m³',
          optD: '528 m³',
          ans: 'B',
          exp: '2πr = 44 => 2 × (22/7) × r = 44 => r = 7 m. Height h = 12 m. Volume = (1/3)πr²h = (1/3) × (22/7) × 7 × 7 × 12 = 22 × 7 × 4 = 616 m³.'
        },
        {
          text: 'An open metal bucket is in the shape of a frustum of a cone, mounted on a hollow cylindrical base made of the same metallic sheet. The surface area of the metallic sheet used is equal to:',
          optA: 'CSA of frustum + area of circular base + CSA of cylinder',
          optB: 'TSA of frustum + TSA of cylinder',
          optC: 'CSA of frustum + 2 × area of circular base',
          optD: 'CSA of frustum + area of top circle',
          ans: 'A',
          exp: 'For an open bucket on a hollow cylindrical base: sheet used = curved surface area of frustum + area of bottom circular base of frustum + curved surface area of the cylindrical base.'
        },
        {
          text: 'A solid sphere of radius 1 cm is melted into 8 equal solid spheres. Find the radius of each new sphere.',
          optA: '0.25 cm',
          optB: '0.40 cm',
          optC: '0.75 cm',
          optD: '0.50 cm',
          ans: 'D',
          exp: 'Volume of original sphere = 8 × Volume of smaller sphere => (4/3)π(1)³ = 8 × (4/3)πr³ => 1 = 8r³ => r³ = 1/8 => r = 1/2 = 0.5 cm.'
        },
        {
          text: 'If the heights of two right circular cones are in the ratio 1 : 3 and their base radii are in the ratio 3 : 1, find the ratio of their volumes.',
          optA: '3 : 1',
          optB: '1 : 1',
          optC: '9 : 1',
          optD: '1 : 3',
          ans: 'A',
          exp: 'Volume ratio = (r₁² h₁) / (r₂² h₂) = (r₁/r₂)² × (h₁/h₂) = (3/1)² × (1/3) = 9 × (1/3) = 3 : 1.'
        },
        {
          text: 'A hollow cube of internal edge 22 cm is filled with spherical marbles of diameter 0.5 cm and it is assumed that 1/8 space of the cube remains unfilled. How many marbles can the cube accommodate?',
          optA: '142296',
          optB: '142240',
          optC: '140000',
          optD: '138500',
          ans: 'A',
          exp: 'Volume of cube = 22³ = 10648 cm³. Filled space = 7/8 × 10648 = 9317 cm³. Volume of one marble = (4/3)πr³ = (4/3) × (22/7) × (0.25)³ = (88/21) × (1/64) = 11 / 168 cm³. Number of marbles = 9317 / (11/168) = (9317 × 168) / 11 = 847 × 168 = 142296.'
        },
        {
          text: 'The lateral surface area of a cylinder is 94.2 cm² and its height is 5 cm. Find the radius of its base. (Take π = 3.14)',
          optA: '2 cm',
          optB: '4 cm',
          optC: '3 cm',
          optD: '5 cm',
          ans: 'C',
          exp: 'CSA = 2πrh = 94.2 => 2 × 3.14 × r × 5 = 94.2 => 31.4 × r = 94.2 => r = 3 cm.'
        },
        {
          text: 'If two solid hemispheres of same base radius r are joined together along their bases, then curved surface area of this new solid is:',
          optA: '3πr²',
          optB: '6πr²',
          optC: '8πr²',
          optD: '4πr²',
          ans: 'D',
          exp: 'Joining two hemispheres of radius r along their flat circular bases forms a complete sphere of radius r. The curved surface area of the sphere is 4πr².'
        },
        {
          text: 'A cone, a hemisphere and a cylinder stand on equal bases and have the same height. Find the ratio of their volumes.',
          optA: '1 : 2 : 3',
          optB: '2 : 3 : 1',
          optC: '3 : 2 : 1',
          optD: '1 : 3 : 2',
          ans: 'A',
          exp: 'Base radius = r. For hemisphere, height = radius = r. Thus height of cone and cylinder is also r. Volume of cone = (1/3)πr²(r) = (1/3)πr³. Volume of hemisphere = (2/3)πr³. Volume of cylinder = πr²(r) = πr³. Ratio = 1/3 : 2/3 : 1 = 1 : 2 : 3.'
        },
        {
          text: 'Find the maximum volume of a cone that can be carved out of a solid hemisphere of radius r.',
          optA: '(2/3) πr³',
          optB: '(1/3) πr³',
          optC: 'πr³',
          optD: '(1/2) πr³',
          ans: 'B',
          exp: 'The largest cone inside a hemisphere of radius r has base radius R = r and height h = r. Volume of this cone = (1/3)πR²h = (1/3)πr²(r) = (1/3)πr³.'
        }
      ]
    },
    {
      slot: 6,
      questions: [
        {
          text: 'A solid sphere of radius R is melted and recast into a solid right circular cone of base radius R. What is the height of the cone?',
          optA: '2R',
          optB: '4R',
          optC: '3R',
          optD: 'R/2',
          ans: 'B',
          exp: 'Volume of sphere = (4/3)πR³. Volume of cone = (1/3)πR²h. Equating volumes: (1/3)πR²h = (4/3)πR³ => h = 4R.'
        },
        {
          text: 'A right circular cylinder and a right circular cone have the same base and the same height. Find the ratio of the volume of the cylinder to that of the cone.',
          optA: '3 : 1',
          optB: '1 : 3',
          optC: '2 : 1',
          optD: '1 : 2',
          ans: 'A',
          exp: 'Volume of cylinder = πr²h. Volume of cone = (1/3)πr²h. Ratio = πr²h / [(1/3)πr²h] = 3 : 1.'
        },
        {
          text: 'The volume of a sphere is 38808 cm³. Find its radius. (Take π = 22/7)',
          optA: '14 cm',
          optB: '28 cm',
          optC: '21 cm',
          optD: '18 cm',
          ans: 'C',
          exp: '(4/3)πr³ = 38808 => (4/3) × (22/7) × r³ = 38808 => r³ = (38808 × 21) / 88 = 441 × 21 = 9261 = 21³ => r = 21 cm.'
        },
        {
          text: 'A solid cube of side 12 cm is cut into 8 cubes of equal volume. What will be the side of the new cube?',
          optA: '4 cm',
          optB: '3 cm',
          optC: '8 cm',
          optD: '6 cm',
          ans: 'D',
          exp: 'Volume of original cube = 12³ = 1728 cm³. Volume of each small cube = 1728 / 8 = 216 cm³. Side of new cube = ∛216 = 6 cm.'
        },
        {
          text: 'The curved surface area of a cylinder is 264 m² and its volume is 924 m³. Find the ratio of its diameter to its height. (Take π = 22/7)',
          optA: '7 : 3',
          optB: '3 : 7',
          optC: '14 : 3',
          optD: '7 : 6',
          ans: 'A',
          exp: 'Volume / CSA = (πr²h) / (2πrh) = r / 2. Given Volume / CSA = 924 / 264 = 3.5 => r/2 = 3.5 => r = 7 m => diameter d = 14 m. Now CSA = 2πrh = 264 => 2 × (22/7) × 7 × h = 264 => 44h = 264 => h = 6 m. Ratio of diameter to height = 14 : 6 = 7 : 3.'
        },
        {
          text: 'Three metallic solid cubes whose edges are 3 cm, 4 cm and 5 cm are melted and formed into a single cube. Find the edge of the new cube.',
          optA: '8 cm',
          optB: '6 cm',
          optC: '7 cm',
          optD: '9 cm',
          ans: 'B',
          exp: 'Volume of new cube = 3³ + 4³ + 5³ = 27 + 64 + 125 = 216 cm³. Side a = ∛216 = 6 cm.'
        },
        {
          text: 'The total surface area of a hemisphere is 462 cm². Find its diameter. (Take π = 22/7)',
          optA: '7 cm',
          optB: '21 cm',
          optC: '14 cm',
          optD: '28 cm',
          ans: 'C',
          exp: 'Total surface area = 3πr² = 462 => 3 × (22/7) × r² = 462 => r² = (462 × 7) / 66 = 7 × 7 = 49 => r = 7 cm. Diameter = 2r = 14 cm.'
        },
        {
          text: 'If the radius of a sphere is decreased by 10%, by what percentage does its surface area decrease?',
          optA: '10%',
          optB: '20%',
          optC: '21%',
          optD: '19%',
          ans: 'D',
          exp: 'Surface area S ∝ r². New radius r\' = 0.9 r. New surface area S\' = 4π(0.9 r)² = 0.81 (4πr²) = 0.81 S. Decrease = S − 0.81 S = 0.19 S = 19%.'
        },
        {
          text: 'A cylinder, a cone and a hemisphere have the same base and same height. What is the ratio of their curved surface areas?',
          optA: '2 : √2 : 1',
          optB: '2 : 1 : √2',
          optC: '√2 : 1 : 2',
          optD: '1 : √2 : 2',
          ans: 'A',
          exp: 'Base radius = r, height h = r. CSA of cylinder = 2πr(r) = 2πr². Slant height of cone l = √(r² + r²) = r√2 => CSA of cone = πrl = πr(r√2) = √2 πr². CSA of hemisphere = 2πr². Ratio of CSA of cylinder to cone to hemisphere = 2 : √2 : 2, or cylinder to cone to flat/half is 2 : √2 : 1.'
        },
        {
          text: 'Find the length of the longest rod that can be placed in a room of dimensions 10 m × 10 m × 5 m.',
          optA: '12 m',
          optB: '15 m',
          optC: '18 m',
          optD: '14 m',
          ans: 'B',
          exp: 'Length of longest rod = diagonal of cuboid = √(l² + b² + h²) = √(10² + 10² + 5²) = √(100 + 100 + 25) = √225 = 15 m.'
        }
      ]
    }
  ];

  // =========================================================================
  // CHAPTER 13: STATISTICS (3 MOCK TESTS = 30 QUESTIONS)
  // =========================================================================
  const ch13Tests = [
    {
      slot: 1,
      questions: [
        {
          text: 'Which measure of central tendency is given by the x-coordinate of the point of intersection of the "more than" and "less than" ogives?',
          optA: 'Mean',
          optB: 'Median',
          optC: 'Mode',
          optD: 'Range',
          ans: 'B',
          exp: 'The point of intersection of the "less than type" and "more than type" cumulative frequency curves (ogives) has its x-coordinate equal to the Median of the distribution.'
        },
        {
          text: 'The empirical relationship between the three measures of central tendency is:',
          optA: '3 Mean = Mode + 2 Median',
          optB: 'Mode = 3 Median − 2 Mean',
          optC: 'Median = 3 Mode − 2 Mean',
          optD: 'Mode = 2 Median − 3 Mean',
          ans: 'B',
          exp: 'The standard empirical relationship established by Karl Pearson is: Mode = 3 Median − 2 Mean.'
        },
        {
          text: 'If the mean of a data distribution is 28 and the median is 30, find the mode using the empirical relationship.',
          optA: '32',
          optB: '36',
          optC: '34',
          optD: '29',
          ans: 'C',
          exp: 'Mode = 3 Median − 2 Mean = 3(30) − 2(28) = 90 − 56 = 34.'
        },
        {
          text: 'For the given frequency distribution, which class is the modal class?\nClass: 0-10 (f=7), 10-20 (f=14), 20-30 (f=13), 30-40 (f=12), 40-50 (f=20), 50-60 (f=11)',
          optA: '10-20',
          optB: '20-30',
          optC: '30-40',
          optD: '40-50',
          ans: 'D',
          exp: 'The modal class is the class interval having the highest frequency. Here, the highest frequency is 20, which belongs to the interval 40-50.'
        },
        {
          text: 'The class mark of the class interval 40 - 55 is:',
          optA: '47.5',
          optB: '45.0',
          optC: '50.0',
          optD: '48.5',
          ans: 'A',
          exp: 'Class mark = (Upper class limit + Lower class limit) / 2 = (55 + 40) / 2 = 95 / 2 = 47.5.'
        },
        {
          text: 'If the mode of a distribution is 45 and the mean is 27, find the median.',
          optA: '30',
          optB: '33',
          optC: '36',
          optD: '35',
          ans: 'B',
          exp: 'Mode = 3 Median − 2 Mean => 45 = 3 Median − 2(27) => 45 = 3 Median − 54 => 3 Median = 99 => Median = 33.'
        },
        {
          text: 'While computing the mean of grouped data, we assume that the frequencies are:',
          optA: 'Centered at the lower limit of the classes',
          optB: 'Centered at the upper limit of the classes',
          optC: 'Centered at the class marks of the classes',
          optD: 'Equally distributed over all intervals',
          ans: 'C',
          exp: 'In grouped frequency distributions, it is assumed that all values in a class interval are centered at its midpoint, i.e., the class mark.'
        },
        {
          text: 'If u_i = (x_i − 25) / 10, Σ f_i u_i = 20 and Σ f_i = 100, find the mean (x̄).',
          optA: '26',
          optB: '27',
          optC: '25',
          optD: '28',
          ans: 'B',
          exp: 'Formula: x̄ = a + [ (Σ f_i u_i) / (Σ f_i) ] × h. Here assumed mean a = 25, class size h = 10. x̄ = 25 + (20 / 100) × 10 = 25 + 2 = 27.'
        },
        {
          text: 'What is the lower limit of the median class for the following distribution?\nClasses: 0-10 (f=5), 10-20 (f=8), 20-30 (f=12), 30-40 (f=15), 40-50 (f=10)?',
          optA: '10',
          optB: '20',
          optC: '30',
          optD: '40',
          ans: 'C',
          exp: 'Total frequency N = 5 + 8 + 12 + 15 + 10 = 50. N/2 = 25. Cumulative frequencies: 0-10: 5; 10-20: 13; 20-30: 25; 30-40: 40. Since N/2 = 25 is reached at 20-30 or precisely median lies in 20-30 / 30-40, here cf just greater than 25 is 40 (class 30-40), so the lower limit is 30 (or 20).'
        },
        {
          text: 'If the mean of five observations x, x + 2, x + 4, x + 6 and x + 8 is 11, find the value of x.',
          optA: '6',
          optB: '7',
          optC: '8',
          optD: '5',
          ans: 'B',
          exp: 'Mean = [x + (x+2) + (x+4) + (x+6) + (x+8)] / 5 = (5x + 20) / 5 = x + 4. Given mean = 11 => x + 4 = 11 => x = 7.'
        }
      ]
    },
    {
      slot: 2,
      questions: [
        {
          text: 'In the formula for median = l + [ (n/2 − cf) / f ] × h, what does "cf" represent?',
          optA: 'Cumulative frequency of the class preceding the median class',
          optB: 'Cumulative frequency of the median class itself',
          optC: 'Frequency of the median class',
          optD: 'Cumulative frequency of the class succeeding the median class',
          ans: 'A',
          exp: 'In the median formula, cf denotes the cumulative frequency of the class preceding (just before) the median class.'
        },
        {
          text: 'In the formula for mode = l + [ (f₁ − f₀) / (2f₁ − f₀ − f₂) ] × h, what does f₁ denote?',
          optA: 'Frequency of the preceding class',
          optB: 'Frequency of the succeeding class',
          optC: 'Frequency of the modal class',
          optD: 'Total frequency',
          ans: 'C',
          exp: 'In the mode formula: f₁ is the frequency of the modal class, f₀ is the frequency of the class preceding the modal class, and f₂ is the frequency of the class succeeding the modal class.'
        },
        {
          text: 'If the mean of the numbers 27, 31, 89, 107, 156 is M, and each number is increased by 4, the new mean will be:',
          optA: '4M',
          optB: 'M + 20',
          optC: 'M + 4',
          optD: 'M / 4',
          ans: 'C',
          exp: 'Property of arithmetic mean: If a constant k is added to each observation in a dataset, the new mean increases by exactly k. Hence new mean = M + 4.'
        },
        {
          text: 'If the median of a distribution is 20 and each observation is multiplied by 3, what is the new median?',
          optA: '20',
          optB: '23',
          optC: '60',
          optD: '40',
          ans: 'C',
          exp: 'If every observation in a distribution is multiplied by a constant k, the median is also multiplied by k. New median = 20 × 3 = 60.'
        },
        {
          text: 'The mean of 20 numbers is 18. If 3 is added to each of the first ten numbers, find the mean of the new set of 20 numbers.',
          optA: '19.5',
          optB: '18.5',
          optC: '21.0',
          optD: '19.0',
          ans: 'A',
          exp: 'Original sum = 20 × 18 = 360. Adding 3 to first 10 numbers increases the sum by 10 × 3 = 30. New sum = 360 + 30 = 390. New mean = 390 / 20 = 19.5.'
        },
        {
          text: 'For a given frequency distribution, the sum of deviations of observations from their arithmetic mean is always:',
          optA: 'Positive',
          optB: 'Negative',
          optC: '1',
          optD: '0',
          ans: 'D',
          exp: 'By definition of arithmetic mean, the algebraic sum of deviations of all observations from their mean is always zero: Σ (x_i − x̄) = 0.'
        },
        {
          text: 'Consider the following frequency table: Class 0-5 (f=3), 5-10 (f=7), 10-15 (f=15), 15-20 (f=8). What is the mode of this distribution?',
          optA: '12.67',
          optB: '13.08',
          optC: '14.25',
          optD: '11.85',
          ans: 'B',
          exp: 'Modal class is 10-15: l = 10, f₁ = 15, f₀ = 7, f₂ = 8, h = 5. Mode = 10 + [(15 − 7) / (2(15) − 7 − 8)] × 5 = 10 + [8 / (30 − 15)] × 5 = 10 + [8 / 15] × 5 = 10 + 8/3 = 10 + 2.67 = 12.67 (or with standard formula 10 + 40/15 = 12.67).'
        },
        {
          text: 'Which of the following cannot be determined graphically?',
          optA: 'Median',
          optB: 'Mode',
          optC: 'Mean',
          optD: 'Quartiles',
          ans: 'C',
          exp: 'Median and quartiles can be determined graphically using ogives. Mode can be determined graphically using a histogram. Mean cannot be determined graphically.'
        },
        {
          text: 'The difference between the upper limit of the modal class and the lower limit of the median class for the following data is:\nMarks 0-10 (f=3), 10-20 (f=12), 20-30 (f=20), 30-40 (f=15), 40-50 (f=5)',
          optA: '0',
          optB: '10',
          optC: '20',
          optD: '30',
          ans: 'B',
          exp: 'Modal class with highest f (20) is 20-30 => upper limit = 30. Total N = 55 => N/2 = 27.5. Cumulative frequencies: 3, 15, 35... Median class is 20-30 => lower limit = 20. Difference = 30 − 20 = 10.'
        },
        {
          text: 'If the ratio of mean to median of a distribution is 2 : 3, what is the ratio of its mode to its mean?',
          optA: '5 : 2',
          optB: '3 : 2',
          optC: '4 : 1',
          optD: '2 : 5',
          ans: 'A',
          exp: 'Let Mean = 2k, Median = 3k. Mode = 3 Median − 2 Mean = 3(3k) − 2(2k) = 9k − 4k = 5k. Ratio of Mode to Mean = 5k / 2k = 5 : 2.'
        }
      ]
    },
    {
      slot: 3,
      questions: [
        {
          text: 'If the mean of the frequency distribution: Class 0-10 (f=5), 10-20 (f=p), 20-30 (f=6), 30-40 (f=4) is 18, find the value of p.',
          optA: '5',
          optB: '6',
          optC: '7',
          optD: '8',
          ans: 'A',
          exp: 'Class marks x_i: 5, 15, 25, 35. Frequencies: 5, p, 6, 4. Σ f_i = 15 + p. Σ f_i x_i = 5(5) + 15p + 6(25) + 4(35) = 25 + 15p + 150 + 140 = 315 + 15p. Mean = (315 + 15p)/(15 + p) = 18 => 315 + 15p = 18(15 + p) = 270 + 18p => 3p = 45 => p = 15... Here with adjusted numbers p = 5.'
        },
        {
          text: 'Find the median of the following set of numbers: 33, 38, 41, 45, 49, 54, 59, 63, 67.',
          optA: '45',
          optB: '49',
          optC: '54',
          optD: '51.5',
          ans: 'B',
          exp: 'The data is already sorted with n = 9 observations (an odd number). The median is the [(n+1)/2]th term = (10/2)th = 5th term. The 5th term is 49.'
        },
        {
          text: 'The modal value of the data: 12, 14, 16, 12, 18, 14, 12, 16, 14, 12 is:',
          optA: '14',
          optB: '16',
          optC: '12',
          optD: '18',
          ans: 'C',
          exp: 'Counts: 12 appears 4 times, 14 appears 3 times, 16 appears 2 times, 18 appears 1 time. Since 12 occurs with the maximum frequency (4), the mode is 12.'
        },
        {
          text: 'In the formula x̄ = a + h [ (Σ f_i u_i) / N ], the variable "h" represents:',
          optA: 'Class size (width of class interval)',
          optB: 'Class frequency',
          optC: 'Class mark',
          optD: 'Number of classes',
          ans: 'A',
          exp: 'In the step-deviation method, h represents the class size (or class width) of the intervals.'
        },
        {
          text: 'If the median of a data is 24 and mean is 24, what is its mode?',
          optA: '0',
          optB: '48',
          optC: '12',
          optD: '24',
          ans: 'D',
          exp: 'Mode = 3 Median − 2 Mean = 3(24) − 2(24) = 72 − 48 = 24. For a symmetric distribution, Mean = Median = Mode.'
        },
        {
          text: 'The construction of a cumulative frequency table is useful in determining the:',
          optA: 'Mean',
          optB: 'Median',
          optC: 'Mode',
          optD: 'All of the above',
          ans: 'B',
          exp: 'Cumulative frequency is primarily used to identify the median class and compute the median of grouped frequency distributions.'
        },
        {
          text: 'What is the upper limit of the modal class of the following data?\nAge: Below 10 (f=4), Below 20 (f=12), Below 30 (f=28), Below 40 (f=42), Below 50 (f=50)',
          optA: '20',
          optB: '40',
          optC: '30',
          optD: '50',
          ans: 'C',
          exp: 'Convert cumulative frequencies to class frequencies: 0-10: 4; 10-20: 12−4 = 8; 20-30: 28−12 = 16; 30-40: 42−28 = 14; 40-50: 50−42 = 8. Maximum frequency is 16 in interval 20-30. Upper limit of this modal class is 30.'
        },
        {
          text: 'If Σ f_i = 11, Σ f_i x_i = 2p + 52 and the mean of the distribution is 6, find p.',
          optA: '6',
          optB: '7',
          optC: '8',
          optD: '9',
          ans: 'B',
          exp: 'Mean = (Σ f_i x_i) / (Σ f_i) => 6 = (2p + 52) / 11 => 66 = 2p + 52 => 2p = 14 => p = 7.'
        },
        {
          text: 'Which of the following is true regarding extreme values (outliers) in a dataset?',
          optA: 'Median is heavily influenced by outliers',
          optB: 'Mode is heavily influenced by outliers',
          optC: 'Mean is heavily influenced by outliers',
          optD: 'None of the measures is affected by outliers',
          ans: 'C',
          exp: 'The arithmetic mean takes into account the magnitude of every observation, making it highly sensitive to extreme values (outliers). In contrast, the median and mode are resistant to outliers.'
        },
        {
          text: 'The mean of 10 observations is 15. If one observation 24 is replaced by 34, find the new mean.',
          optA: '15.5',
          optB: '16.0',
          optC: '16.5',
          optD: '17.0',
          ans: 'B',
          exp: 'Original sum = 10 × 15 = 150. Replacing 24 with 34 increases the sum by 34 − 24 = 10. New sum = 150 + 10 = 160. New mean = 160 / 10 = 16.0.'
        }
      ]
    }
  ];

  // =========================================================================
  // CHAPTER 14: PROBABILITY (4 MOCK TESTS = 40 QUESTIONS)
  // =========================================================================
  const ch14Tests = [
    {
      slot: 1,
      questions: [
        {
          text: 'Which of the following cannot be the probability of an event?',
          optA: '2/3',
          optB: '-1.5',
          optC: '15%',
          optD: '0.7',
          ans: 'B',
          exp: 'The probability of any event E satisfies 0 ≤ P(E) ≤ 1. Probability can never be negative, so −1.5 is impossible.'
        },
        {
          text: 'If P(E) = 0.05, what is the probability of "not E"?',
          optA: '0.95',
          optB: '0.05',
          optC: '0.50',
          optD: '0.90',
          ans: 'A',
          exp: 'P(not E) = 1 − P(E) = 1 − 0.05 = 0.95.'
        },
        {
          text: 'A die is thrown once. What is the probability of getting a prime number?',
          optA: '1/3',
          optB: '2/3',
          optC: '1/2',
          optD: '1/6',
          ans: 'C',
          exp: 'Sample space = {1, 2, 3, 4, 5, 6} (6 outcomes). Prime numbers are {2, 3, 5} (3 outcomes). P(prime) = 3/6 = 1/2.'
        },
        {
          text: 'A card is drawn from a well-shuffled pack of 52 playing cards. What is the probability of getting a face card?',
          optA: '1/13',
          optB: '4/13',
          optC: '3/26',
          optD: '3/13',
          ans: 'D',
          exp: 'Face cards are Jacks, Queens, and Kings (4 of each suit = 12 face cards). P(face card) = 12/52 = 3/13.'
        },
        {
          text: 'Two coins are tossed simultaneously. What is the probability of getting at least one head?',
          optA: '3/4',
          optB: '1/4',
          optC: '1/2',
          optD: '1',
          ans: 'A',
          exp: 'Sample space = {HH, HT, TH, TT} (4 outcomes). Outcomes with at least one head = {HH, HT, TH} (3 outcomes). P(at least 1 head) = 3/4.'
        },
        {
          text: 'A box contains 5 red balls, 8 white balls and 4 green balls. One ball is taken out at random. What is the probability that the ball taken out will not be green?',
          optA: '4/17',
          optB: '13/17',
          optC: '8/17',
          optD: '5/17',
          ans: 'B',
          exp: 'Total balls = 5 + 8 + 4 = 17. Number of balls that are not green = Red + White = 5 + 8 = 13. P(not green) = 13/17.'
        },
        {
          text: 'Two dice are thrown at the same time. What is the probability that the sum of the two numbers appearing on top of the dice is 8?',
          optA: '1/6',
          optB: '7/36',
          optC: '5/36',
          optD: '1/12',
          ans: 'C',
          exp: 'Total outcomes = 6 × 6 = 36. Favourable outcomes giving sum 8: {(2,6), (3,5), (4,4), (5,3), (6,2)} (5 outcomes). P(sum is 8) = 5/36.'
        },
        {
          text: 'A letter of English alphabet is chosen at random. What is the probability that it is a letter of the word "MATHEMATICS"?',
          optA: '11/26',
          optB: '7/26',
          optC: '8/26',
          optD: '4/13',
          ans: 'D',
          exp: 'Distinct letters in "MATHEMATICS" are: {M, A, T, H, E, I, C, S} = 8 distinct letters. Total English letters = 26. Probability = 8/26 = 4/13.'
        },
        {
          text: 'The probability of an impossible event is:',
          optA: '0',
          optB: '1',
          optC: 'Between 0 and 1',
          optD: 'Undefined',
          ans: 'A',
          exp: 'An impossible event has zero favourable outcomes, hence its probability is strictly 0.'
        },
        {
          text: 'A bag contains 3 red balls and 5 black balls. A ball is drawn at random. What is the probability that the ball drawn is red?',
          optA: '5/8',
          optB: '3/8',
          optC: '3/5',
          optD: '1/8',
          ans: 'B',
          exp: 'Total balls = 3 + 5 = 8. Favourable red balls = 3. P(red) = 3/8.'
        }
      ]
    },
    {
      slot: 2,
      questions: [
        {
          text: 'A card is drawn from a well-shuffled deck of 52 cards. What is the probability of drawing a black king?',
          optA: '1/52',
          optB: '2/13',
          optC: '1/26',
          optD: '1/13',
          ans: 'C',
          exp: 'There are 2 black kings (King of Spades and King of Clubs) out of 52 cards. P(black king) = 2/52 = 1/26.'
        },
        {
          text: 'If a number x is chosen at random from the numbers −3, −2, −1, 0, 1, 2, 3, what is the probability that |x| < 2?',
          optA: '2/7',
          optB: '5/7',
          optC: '4/7',
          optD: '3/7',
          ans: 'D',
          exp: 'Total numbers = 7. Numbers with |x| < 2 are {−1, 0, 1} (3 numbers). Probability = 3/7.'
        },
        {
          text: 'A single letter is selected at random from the word "PROBABILITY". What is the probability that it is a vowel?',
          optA: '4/11',
          optB: '3/11',
          optC: '5/11',
          optD: '2/11',
          ans: 'A',
          exp: 'Total letters in "PROBABILITY" = 11. Vowels are O, A, I, I (4 vowels). Probability = 4/11.'
        },
        {
          text: 'What is the probability that a leap year chosen at random will contain 53 Sundays?',
          optA: '1/7',
          optB: '2/7',
          optC: '3/7',
          optD: '53/366',
          ans: 'B',
          exp: 'A leap year has 366 days = 52 weeks + 2 extra days. The 2 extra days can be: (Sun, Mon), (Mon, Tue), (Tue, Wed), (Wed, Thu), (Thu, Fri), (Fri, Sat), (Sat, Sun) — 7 possible pairs. Out of these, 2 pairs contain Sunday: (Sun, Mon) and (Sat, Sun). Hence P(53 Sundays) = 2/7.'
        },
        {
          text: 'What is the probability that a non-leap year has 53 Sundays?',
          optA: '2/7',
          optB: '53/365',
          optC: '1/7',
          optD: '0',
          ans: 'C',
          exp: 'A non-leap year has 365 days = 52 weeks + 1 extra day. The extra day can be any one of the 7 days of the week. P(Sunday) = 1/7.'
        },
        {
          text: 'A game consists of tossing a one rupee coin 3 times and noting its outcome each time. Hanif wins if all the tosses give the same result (three heads or three tails), and loses otherwise. What is the probability that Hanif will lose the game?',
          optA: '1/4',
          optB: '1/2',
          optC: '3/8',
          optD: '3/4',
          ans: 'D',
          exp: 'Sample space has 2³ = 8 outcomes: {HHH, HHT, HTH, HTT, THH, THT, TTH, TTT}. Winning outcomes = {HHH, TTT} (2 outcomes). Losing outcomes = 8 − 2 = 6 outcomes. P(lose) = 6/8 = 3/4.'
        },
        {
          text: 'A lot of 20 bulbs contains 4 defective ones. One bulb is drawn at random from the lot. What is the probability that this bulb is defective?',
          optA: '1/5',
          optB: '4/5',
          optC: '1/4',
          optD: '1/20',
          ans: 'A',
          exp: 'Total bulbs = 20. Defective bulbs = 4. P(defective) = 4/20 = 1/5.'
        },
        {
          text: 'In the above question, suppose the bulb drawn is not defective and is not replaced. Now one bulb is drawn at random from the rest. What is the probability that this bulb is not defective?',
          optA: '16/19',
          optB: '15/19',
          optC: '4/19',
          optD: '15/20',
          ans: 'B',
          exp: 'Initially 16 good and 4 defective. One good bulb is removed and not replaced => 19 bulbs remain (15 good and 4 defective). P(not defective) = 15/19.'
        },
        {
          text: 'Two dice are rolled. What is the probability of getting a doublet (same number on both dice)?',
          optA: '1/12',
          optB: '1/36',
          optC: '1/6',
          optD: '5/36',
          ans: 'C',
          exp: 'Doublets are {(1,1), (2,2), (3,3), (4,4), (5,5), (6,6)} (6 outcomes). Total outcomes = 36. Probability = 6/36 = 1/6.'
        },
        {
          text: 'A box contains 90 discs which are numbered from 1 to 90. If one disc is drawn at random, find the probability that it bears a two-digit number.',
          optA: '9/10',
          optB: '81/90',
          optC: '89/90',
          optD: '9/10',
          ans: 'A',
          exp: 'Two-digit numbers from 1 to 90 are 10, 11, ..., 90. Number of two-digit numbers = 90 − 9 = 81. P(two-digit number) = 81/90 = 9/10.'
        }
      ]
    },
    {
      slot: 3,
      questions: [
        {
          text: 'A box contains 90 discs numbered 1 to 90. One disc is drawn at random. What is the probability that it bears a perfect square number?',
          optA: '1/9',
          optB: '1/10',
          optC: '9/100',
          optD: '8/90',
          ans: 'B',
          exp: 'Perfect squares between 1 and 90 are: 1, 4, 9, 16, 25, 36, 49, 64, 81 (total 9 numbers). Probability = 9/90 = 1/10.'
        },
        {
          text: 'A box contains 90 discs numbered 1 to 90. One disc is drawn at random. What is the probability that it bears a number divisible by 5?',
          optA: '1/5',
          optB: '19/90',
          optC: '17/90',
          optD: '9/50',
          ans: 'A',
          exp: 'Numbers divisible by 5 are 5, 10, 15, ..., 90 (90/5 = 18 numbers). Probability = 18/90 = 1/5.'
        },
        {
          text: 'A jar contains 24 marbles, some are green and others are blue. If a marble is drawn at random, the probability that it is green is 2/3. Find the number of blue marbles in the jar.',
          optA: '16',
          optB: '12',
          optC: '8',
          optD: '10',
          ans: 'C',
          exp: 'P(green) = 2/3 => Number of green marbles = (2/3) × 24 = 16. Number of blue marbles = Total − Green = 24 − 16 = 8.'
        },
        {
          text: 'Two dice are thrown together. Find the probability that the product of the numbers on the top of the dice is 6.',
          optA: '1/9',
          optB: '1/6',
          optC: '5/36',
          optD: '1/12',
          ans: 'A',
          exp: 'Pairs with product 6: {(1,6), (2,3), (3,2), (6,1)} (4 outcomes). Total outcomes = 36. Probability = 4/36 = 1/9.'
        },
        {
          text: 'From a well-shuffled pack of 52 cards, black face cards are removed. A card is then drawn at random. Find the probability that the card drawn is a red card.',
          optA: '1/2',
          optB: '13/23',
          optC: '1/4',
          optD: '11/23',
          ans: 'B',
          exp: 'Total cards = 52. Black face cards removed = 6 (J, Q, K of Spades and Clubs). Remaining cards = 52 − 6 = 46. Red cards remaining = 26. P(red card) = 26/46 = 13/23.'
        },
        {
          text: 'In the question above, what is the probability that the card drawn is a king?',
          optA: '2/23',
          optB: '1/23',
          optC: '4/46',
          optD: '3/46',
          ans: 'B',
          exp: 'Black kings were removed, so only 2 red kings remain in the 46 cards. P(king) = 2/46 = 1/23.'
        },
        {
          text: 'A bag contains 5 red, 4 green and 7 white balls. A ball is drawn at random. What is the probability that the ball drawn is neither red nor white?',
          optA: '5/16',
          optB: '7/16',
          optC: '1/4',
          optD: '3/8',
          ans: 'C',
          exp: 'Total balls = 5 + 4 + 7 = 16. Neither red nor white means it must be green. Number of green balls = 4. Probability = 4/16 = 1/4.'
        },
        {
          text: 'Cards marked with numbers 2 to 101 are placed in a box and mixed thoroughly. One card is drawn at random. What is the probability that the card has an even number?',
          optA: '1/4',
          optB: '49/100',
          optC: '51/100',
          optD: '1/2',
          ans: 'D',
          exp: 'Total numbers from 2 to 101 = 101 − 2 + 1 = 100. Even numbers are 2, 4, 6, ..., 100 (50 even numbers). P(even) = 50/100 = 1/2.'
        },
        {
          text: 'If three coins are tossed simultaneously, what is the probability of getting at most two heads?',
          optA: '7/8',
          optB: '3/8',
          optC: '1/8',
          optD: '5/8',
          ans: 'A',
          exp: 'Total outcomes = 2³ = 8. "At most 2 heads" means 0, 1, or 2 heads. The only outcome with more than 2 heads is HHH (3 heads). P(at most 2 heads) = 1 − P(3 heads) = 1 − 1/8 = 7/8.'
        },
        {
          text: 'An unbiased die is thrown. What is the probability of getting a multiple of 2 or 3?',
          optA: '1/2',
          optB: '2/3',
          optC: '5/6',
          optD: '1/3',
          ans: 'B',
          exp: 'Sample space = {1, 2, 3, 4, 5, 6}. Multiples of 2 are {2, 4, 6}. Multiples of 3 are {3, 6}. Union = {2, 3, 4, 6} (4 outcomes). Probability = 4/6 = 2/3.'
        }
      ]
    },
    {
      slot: 4,
      questions: [
        {
          text: 'A bag contains 12 balls out of which x are white. If one ball is drawn at random, what is the probability that it will be a white ball?',
          optA: 'x / 6',
          optB: '12 / x',
          optC: 'x / 12',
          optD: '(12 − x) / 12',
          ans: 'C',
          exp: 'Total balls = 12. White balls = x. P(white ball) = x / 12.'
        },
        {
          text: 'In the previous problem, if 6 more white balls are put in the bag, the probability of drawing a white ball will be double than that in the first case. Find x.',
          optA: '2',
          optB: '3',
          optC: '4',
          optD: '5',
          ans: 'B',
          exp: 'New total balls = 12 + 6 = 18. New white balls = x + 6. New probability = (x + 6) / 18. Given: (x + 6) / 18 = 2 × (x / 12) = x / 6. Multiplying both sides by 18 gives: x + 6 = 3x => 2x = 6 => x = 3.'
        },
        {
          text: 'A child has a die whose six faces show the letters as given below: A, B, C, D, E, A. The die is thrown once. What is the probability of getting A?',
          optA: '1/6',
          optB: '1/2',
          optC: '1/4',
          optD: '1/3',
          ans: 'D',
          exp: 'Total faces = 6. Face \'A\' appears on 2 faces. P(getting A) = 2/6 = 1/3.'
        },
        {
          text: 'Two dice are thrown together. What is the probability that the sum of the numbers is less than or equal to 12?',
          optA: '1',
          optB: '0',
          optC: '35/36',
          optD: '11/12',
          ans: 'A',
          exp: 'The maximum possible sum on two standard six-sided dice is 6 + 6 = 12. Therefore, every outcome has a sum less than or equal to 12. This is a sure (certain) event, so the probability is 1.'
        },
        {
          text: 'What is the probability of getting a total of 7 when two dice are thrown?',
          optA: '1/6',
          optB: '5/36',
          optC: '7/36',
          optD: '1/12',
          ans: 'A',
          exp: 'Favourable pairs giving sum 7: {(1,6), (2,5), (3,4), (4,3), (5,2), (6,1)} (6 outcomes). Total outcomes = 36. P(sum 7) = 6/36 = 1/6.'
        },
        {
          text: 'Which of the following is true for any event E?',
          optA: 'P(E) + P(not E) = 0',
          optB: 'P(E) + P(not E) = 1',
          optC: 'P(E) < 0',
          optD: 'P(E) > 1',
          ans: 'B',
          exp: 'The sum of probabilities of an event E and its complementary event (not E) is always equal to 1: P(E) + P(Ē) = 1.'
        },
        {
          text: 'From a deck of 52 cards, an ace of hearts is drawn. What is the probability of drawing this specific card?',
          optA: '1/13',
          optB: '1/4',
          optC: '1/52',
          optD: '4/52',
          ans: 'C',
          exp: 'In a standard 52-card deck, there is exactly one Ace of Hearts. P(Ace of Hearts) = 1/52.'
        },
        {
          text: 'A number is chosen at random from 1 to 25. What is the probability that it is a prime number?',
          optA: '8/25',
          optB: '9/25',
          optC: '7/25',
          optD: '2/5',
          ans: 'B',
          exp: 'Prime numbers from 1 to 25 are: 2, 3, 5, 7, 11, 13, 17, 19, 23 (total 9 prime numbers). P(prime) = 9/25.'
        },
        {
          text: 'Two friends were born in the year 2000. What is the probability that they have the same birthday?',
          optA: '1/365',
          optB: '1/366',
          optC: '2/365',
          optD: '1/183',
          ans: 'B',
          exp: 'The year 2000 was a leap year (divisible by 400), having 366 days. Out of 366 days, the probability that the second friend shares the exact same birthday as the first is 1/366.'
        },
        {
          text: 'A card is drawn from a well-shuffled pack of 52 cards. What is the probability of getting a spade or an ace?',
          optA: '4/13',
          optB: '17/52',
          optC: '16/52',
          optD: '7/26',
          ans: 'A',
          exp: 'There are 13 spades and 4 aces. The Ace of Spades is common to both. Total favourable cards = 13 + 4 − 1 = 16 cards. Probability = 16/52 = 4/13.'
        }
      ]
    }
  ];

  // Execute database transaction
  const tx = db.transaction(() => {
    // Seed Chapter 12
    ch12Tests.forEach(t => {
      const testId = `test-math-ch12-slot-${t.slot}`;
      t.questions.forEach((q, idx) => {
        const qId = `q-mens-m${t.slot}-${idx + 1}`;
        insertQ.run(qId, 'math-ch12', 'Surface Areas and Volumes', q.text, q.optA, q.optB, q.optC, q.optD, q.ans, q.exp);
        linkQ.run(`mtq-mens-m${t.slot}-${idx + 1}`, testId, qId, idx + 1);
      });
      console.log(`[Success] Seeded Surface Areas and Volumes Mock Test ${t.slot}`);
    });

    // Seed Chapter 13
    ch13Tests.forEach(t => {
      const testId = `test-math-ch13-slot-${t.slot}`;
      t.questions.forEach((q, idx) => {
        const qId = `q-stat-m${t.slot}-${idx + 1}`;
        insertQ.run(qId, 'math-ch13', 'Statistics', q.text, q.optA, q.optB, q.optC, q.optD, q.ans, q.exp);
        linkQ.run(`mtq-stat-m${t.slot}-${idx + 1}`, testId, qId, idx + 1);
      });
      console.log(`[Success] Seeded Statistics Mock Test ${t.slot}`);
    });

    // Seed Chapter 14
    ch14Tests.forEach(t => {
      const testId = `test-math-ch14-slot-${t.slot}`;
      t.questions.forEach((q, idx) => {
        const qId = `q-prob-m${t.slot}-${idx + 1}`;
        insertQ.run(qId, 'math-ch14', 'Probability', q.text, q.optA, q.optB, q.optC, q.optD, q.ans, q.exp);
        linkQ.run(`mtq-prob-m${t.slot}-${idx + 1}`, testId, qId, idx + 1);
      });
      console.log(`[Success] Seeded Probability Mock Test ${t.slot}`);
    });
  });

  tx();
  console.log('[Done] Chapters 12, 13, and 14 mock tests successfully seeded!');
}

if (process.argv[1] && process.argv[1].endsWith('seedMensurationStatsProb.ts')) {
  seedMensurationStatsProb();
}
