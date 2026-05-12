-- ============================================================
-- Clean existing data (keep profiles, materias, periodos,
-- categorias_inventario, recursos, prestamos)
-- ============================================================
DELETE FROM public.notas;
DELETE FROM public.asistencia;
DELETE FROM public.asignaciones;
DELETE FROM public.estudiantes;
DELETE FROM public.grupos;
DELETE FROM public.grados;

-- ============================================================
-- Grados
-- ============================================================
INSERT INTO public.grados (id, nombre, nivel) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Sexto',    6),
  ('a1000000-0000-0000-0000-000000000002', 'Séptimo',  7),
  ('a1000000-0000-0000-0000-000000000003', 'Octavo',   8),
  ('a1000000-0000-0000-0000-000000000004', 'Noveno',   9),
  ('a1000000-0000-0000-0000-000000000005', 'Décimo',   10),
  ('a1000000-0000-0000-0000-000000000006', 'Undécimo', 11);

-- ============================================================
-- Grupos (un grupo por grado, jornada mañana)
-- ============================================================
INSERT INTO public.grupos (id, nombre, grado_id, jornada, director_id) VALUES
  ('b1000000-0000-0000-0000-000000000001', '6-1',  'a1000000-0000-0000-0000-000000000001', 'manana', NULL),
  ('b1000000-0000-0000-0000-000000000002', '7-1',  'a1000000-0000-0000-0000-000000000002', 'manana', NULL),
  ('b1000000-0000-0000-0000-000000000003', '8-1',  'a1000000-0000-0000-0000-000000000003', 'manana', NULL),
  ('b1000000-0000-0000-0000-000000000004', '9-1',  'a1000000-0000-0000-0000-000000000004', 'manana', NULL),
  ('b1000000-0000-0000-0000-000000000005', '10-1', 'a1000000-0000-0000-0000-000000000005', 'manana', NULL),
  ('b1000000-0000-0000-0000-000000000006', '11-1', 'a1000000-0000-0000-0000-000000000006', 'manana', NULL);

-- ============================================================
-- Estudiantes 6-1 (13 estudiantes)
-- ============================================================
INSERT INTO public.estudiantes (nombre, apellido, documento, fecha_nacimiento, grupo_id, activo) VALUES
  ('Santiago',          'Aparicio Martínez',    '1097729118', NULL, 'b1000000-0000-0000-0000-000000000001', true),
  ('Maicol',            'Cardona Trujillo',     '1037127386', NULL, 'b1000000-0000-0000-0000-000000000001', true),
  ('Nayith Alexandra',  'Castañeda Arévalo',    '1090279002', NULL, 'b1000000-0000-0000-0000-000000000001', true),
  ('Jean Carlos',       'Castaño Pineda',       '1023022463', NULL, 'b1000000-0000-0000-0000-000000000001', true),
  ('Erik Manuel',       'Criollo Giraldo',      '1097728885', NULL, 'b1000000-0000-0000-0000-000000000001', true),
  ('Diego Fernando',    'Garzón Marín',         '1062017019', NULL, 'b1000000-0000-0000-0000-000000000001', true),
  ('Juan David',        'Gil Grajales',         '1097730787', NULL, 'b1000000-0000-0000-0000-000000000001', true),
  ('Amaru',             'González Peláez',      '1091887233', NULL, 'b1000000-0000-0000-0000-000000000001', true),
  ('Heilyn Zalome',     'Prada Vargas',         '1098311979', NULL, 'b1000000-0000-0000-0000-000000000001', true),
  ('Esteban',           'Sánchez Henao',        '1030101258', NULL, 'b1000000-0000-0000-0000-000000000001', true),
  ('Samantha',          'Sánchez Henao',        '1030101259', NULL, 'b1000000-0000-0000-0000-000000000001', true),
  ('Ainara',            'Torres Cardona',       '1095181503', NULL, 'b1000000-0000-0000-0000-000000000001', true),
  ('Dilan',             'Vélez Ríos',           '1095269714', NULL, 'b1000000-0000-0000-0000-000000000001', true);

-- ============================================================
-- Estudiantes 7-1 (6 estudiantes)
-- ============================================================
INSERT INTO public.estudiantes (nombre, apellido, documento, fecha_nacimiento, grupo_id, activo) VALUES
  ('Karlismar Luciana', 'Alejo Garcías',        '6584585',    NULL, 'b1000000-0000-0000-0000-000000000002', true),
  ('Sofía',             'Cardona Trujillo',     '1037127387', NULL, 'b1000000-0000-0000-0000-000000000002', true),
  ('Jorge Alexander',   'Castrillón Hernández', '1097727651', NULL, 'b1000000-0000-0000-0000-000000000002', true),
  ('María Camila',      'Morales Otálvaro',     '1115360414', NULL, 'b1000000-0000-0000-0000-000000000002', true),
  ('Ian Alejandro',     'Ríos Rodríguez',       '1097728238', NULL, 'b1000000-0000-0000-0000-000000000002', true),
  ('Moisés Abrahan',    'Siso Carrasquel',      '6905259',    NULL, 'b1000000-0000-0000-0000-000000000002', true);

-- ============================================================
-- Estudiantes 8-1 (11 estudiantes)
-- ============================================================
INSERT INTO public.estudiantes (nombre, apellido, documento, fecha_nacimiento, grupo_id, activo) VALUES
  ('Emmily',            'Cardona Ríos',         '1096671700', NULL, 'b1000000-0000-0000-0000-000000000003', true),
  ('Yohan Estiven',     'Castañeda Arévalo',    '1095180322', NULL, 'b1000000-0000-0000-0000-000000000003', true),
  ('Kinberlin Yurani',  'Cobo Morales',         '1097038643', NULL, 'b1000000-0000-0000-0000-000000000003', true),
  ('Ferney',            'Correa Gálviz',        '1095553000', NULL, 'b1000000-0000-0000-0000-000000000003', true),
  ('Sol Mayerly',       'Duque Roa',            '1096671772', NULL, 'b1000000-0000-0000-0000-000000000003', true),
  ('Jhoan Sebastián',   'Figueroa Rendón',      '1097727515', NULL, 'b1000000-0000-0000-0000-000000000003', true),
  ('Ferggy Luciana',    'Giraldo Ríos',         '1115192223', NULL, 'b1000000-0000-0000-0000-000000000003', true),
  ('Brayan Estiven',    'Gómez Agredo',         '1096671507', NULL, 'b1000000-0000-0000-0000-000000000003', true),
  ('Salomé',            'Londoño García',       '1096671821', NULL, 'b1000000-0000-0000-0000-000000000003', true),
  ('Jhojan Estiven',    'Ortiz Ladino',         '1090278827', NULL, 'b1000000-0000-0000-0000-000000000003', true),
  ('María José',        'Restrepo Álvarez',     '1144724819', NULL, 'b1000000-0000-0000-0000-000000000003', true);

-- ============================================================
-- Estudiantes 9-1 (11 estudiantes)
-- ============================================================
INSERT INTO public.estudiantes (nombre, apellido, documento, fecha_nacimiento, grupo_id, activo) VALUES
  ('Franyelismar Camila','Alejo Garcías',       '6584711',    NULL, 'b1000000-0000-0000-0000-000000000004', true),
  ('Evelin Yuliana',    'Cobo Morales',         '1097037911', NULL, 'b1000000-0000-0000-0000-000000000004', true),
  ('Vanessa',           'Guerrero Gallego',     '1114121270', NULL, 'b1000000-0000-0000-0000-000000000004', true),
  ('Natalia',           'Herrera Calpa',        '1096671741', NULL, 'b1000000-0000-0000-0000-000000000004', true),
  ('Lina María',        'Jurado Lopera',        '1104830620', NULL, 'b1000000-0000-0000-0000-000000000004', true),
  ('María José',        'Londoño Torres',       '1183463101', NULL, 'b1000000-0000-0000-0000-000000000004', true),
  ('Juan Esteban',      'Melchor Suárez',       '1090277765', NULL, 'b1000000-0000-0000-0000-000000000004', true),
  ('Sara Sofía',        'Melo Viscalla',        '1065899185', NULL, 'b1000000-0000-0000-0000-000000000004', true),
  ('Lucía Anthonella',  'Naré Aponte',          '4496842',    NULL, 'b1000000-0000-0000-0000-000000000004', true),
  ('Jhoan Sebastián',   'Rentería Maturana',    '1078463333', NULL, 'b1000000-0000-0000-0000-000000000004', true),
  ('Ilmer Estiven',     'Romero Ochoa',         '1105870921', NULL, 'b1000000-0000-0000-0000-000000000004', true);

-- ============================================================
-- Estudiantes 10-1 (12 estudiantes)
-- ============================================================
INSERT INTO public.estudiantes (nombre, apellido, documento, fecha_nacimiento, grupo_id, activo) VALUES
  ('Pedro José',        'Carrasquel Fuentes',   '7953851',    NULL, 'b1000000-0000-0000-0000-000000000005', true),
  ('Valentina',         'Flórez Herrera',       '1092854282', NULL, 'b1000000-0000-0000-0000-000000000005', true),
  ('Víctor Rodrigo',    'Loaiza Aguirre',       '1095552427', NULL, 'b1000000-0000-0000-0000-000000000005', true),
  ('Estefanía',         'Lozano Ladino',        '1092461408', NULL, 'b1000000-0000-0000-0000-000000000005', true),
  ('Keidy Natalia',     'Melo Viscalla',        '1065896572', NULL, 'b1000000-0000-0000-0000-000000000005', true),
  ('Magyi Lorena',      'Muñoz Cárdenas',       '1095552785', NULL, 'b1000000-0000-0000-0000-000000000005', true),
  ('Nicolás',           'Orozco Valencia',      '1116252727', NULL, 'b1000000-0000-0000-0000-000000000005', true),
  ('Keysy Fernanda',    'Oyuela Riaño',         '1188967686', NULL, 'b1000000-0000-0000-0000-000000000005', true),
  ('Santiago',          'Quintero Montes',      '1090276392', NULL, 'b1000000-0000-0000-0000-000000000005', true),
  ('Juan José',         'Rodríguez Castro',     '1094930125', NULL, 'b1000000-0000-0000-0000-000000000005', true),
  ('Marlón Jeanpier',   'Rodríguez Sepúlveda',  '1096671448', NULL, 'b1000000-0000-0000-0000-000000000005', true),
  ('Yerig Santiago',    'Zambrano Ochoa',       '1105871305', NULL, 'b1000000-0000-0000-0000-000000000005', true);

-- ============================================================
-- Estudiantes 11-1 (7 estudiantes)
-- ============================================================
INSERT INTO public.estudiantes (nombre, apellido, documento, fecha_nacimiento, grupo_id, activo) VALUES
  ('Víctor Manuel',     'Gañán Arcila',         '1092460444', NULL, 'b1000000-0000-0000-0000-000000000006', true),
  ('Santiago',          'Giraldo Sanz',         '1091205068', NULL, 'b1000000-0000-0000-0000-000000000006', true),
  ('Linda Juliana',     'González Castillo',    '1091205248', NULL, 'b1000000-0000-0000-0000-000000000006', true),
  ('Brayan',            'Guerrero Gallego',     '1111668225', NULL, 'b1000000-0000-0000-0000-000000000006', true),
  ('Juan Esteban',      'Hernández Gaitán',     '1092854549', NULL, 'b1000000-0000-0000-0000-000000000006', true),
  ('Karen',             'Quiñones Valencia',    '1116441220', NULL, 'b1000000-0000-0000-0000-000000000006', true),
  ('Angélica',          'Velasco Montoya',      '1097397007', NULL, 'b1000000-0000-0000-0000-000000000006', true);

-- Verify
SELECT g.nombre AS grado, gr.nombre AS grupo, COUNT(e.id) AS estudiantes
FROM public.grados g
JOIN public.grupos gr ON gr.grado_id = g.id
LEFT JOIN public.estudiantes e ON e.grupo_id = gr.id
GROUP BY g.nombre, gr.nombre, g.nivel
ORDER BY g.nivel;
