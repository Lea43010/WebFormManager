--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: company_types; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.company_types AS ENUM (
    'Dienstleistung',
    'Produktion',
    'Handel',
    'Sonstige'
);


ALTER TYPE public.company_types ;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session ;

--
-- Name: tblattachment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tblattachment (
    id integer NOT NULL,
    project_id integer,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_type text NOT NULL,
    file_size integer NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    original_name character varying(255) NOT NULL
);


ALTER TABLE public.tblattachment ;

--
-- Name: tblattachment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tblattachment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblattachment_id_seq ;

--
-- Name: tblattachment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tblattachment_id_seq OWNED BY public.tblattachment.id;


--
-- Name: tblcompany; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tblcompany (
    company_id integer NOT NULL,
    project_id integer,
    company_art character varying(100),
    company_name character varying(255),
    street character varying(255),
    house_number character varying(10),
    address_line_2 character varying(255),
    postal_code integer,
    city character varying(100),
    city_part character varying(100),
    state character varying(100),
    country character varying(100),
    company_phone text,
    company_email character varying(255)
);


ALTER TABLE public.tblcompany ;

--
-- Name: tblcompany_company_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tblcompany_company_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblcompany_company_id_seq ;

--
-- Name: tblcompany_company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tblcompany_company_id_seq OWNED BY public.tblcompany.company_id;


--
-- Name: tblcomponent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tblcomponent (
    id integer NOT NULL,
    component_id character varying(1000),
    project_id integer,
    component_name character varying(1000)
);


ALTER TABLE public.tblcomponent ;

--
-- Name: tblcomponent_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tblcomponent_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblcomponent_id_seq ;

--
-- Name: tblcomponent_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tblcomponent_id_seq OWNED BY public.tblcomponent.id;


--
-- Name: tblcustomer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tblcustomer (
    id integer NOT NULL,
    project_id integer,
    customer_id integer,
    street character varying(255),
    house_number character varying(10),
    address_line_2 character varying(255),
    postal_code integer,
    city character varying(100),
    city_part character varying(100),
    state character varying(100),
    country character varying(100),
    geodate character varying(255),
    customer_phone text,
    customer_email character varying(255)
);


ALTER TABLE public.tblcustomer ;

--
-- Name: tblcustomer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tblcustomer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblcustomer_id_seq ;

--
-- Name: tblcustomer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tblcustomer_id_seq OWNED BY public.tblcustomer.id;


--
-- Name: tblmaterial; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tblmaterial (
    id integer NOT NULL,
    material_id character varying(1000),
    material_name integer,
    material_amount double precision,
    material_price double precision,
    material_total double precision
);


ALTER TABLE public.tblmaterial ;

--
-- Name: tblmaterial_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tblmaterial_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblmaterial_id_seq ;

--
-- Name: tblmaterial_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tblmaterial_id_seq OWNED BY public.tblmaterial.id;


--
-- Name: tblperson; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tblperson (
    id integer NOT NULL,
    person_id integer,
    project_id integer,
    company_id integer,
    professional_name integer,
    firstname character varying(100),
    lastname character varying(100)
);


ALTER TABLE public.tblperson ;

--
-- Name: tblperson_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tblperson_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblperson_id_seq ;

--
-- Name: tblperson_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tblperson_id_seq OWNED BY public.tblperson.id;


--
-- Name: tblproject; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tblproject (
    id integer NOT NULL,
    project_id integer,
    customer_id integer,
    company_id integer,
    person_id integer,
    permission boolean DEFAULT false,
    permission_name character varying(100),
    project_cluster character varying(255),
    project_name character varying(255),
    project_art character varying(50),
    project_width numeric(10,2),
    project_length numeric(10,2),
    project_height numeric(10,2),
    project_text integer,
    project_startdate date,
    project_enddate date,
    project_stop boolean DEFAULT false,
    project_stopstartdate date,
    project_stopenddate date
);


ALTER TABLE public.tblproject ;

--
-- Name: tblproject_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tblproject_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblproject_id_seq ;

--
-- Name: tblproject_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tblproject_id_seq OWNED BY public.tblproject.id;


--
-- Name: tbluser; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tbluser (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    user_name character varying(100),
    user_email character varying(255)
);


ALTER TABLE public.tbluser ;

--
-- Name: tbluser_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tbluser_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tbluser_id_seq ;

--
-- Name: tbluser_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tbluser_id_seq OWNED BY public.tbluser.id;


--
-- Name: tblattachment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tblattachment ALTER COLUMN id SET DEFAULT nextval('public.tblattachment_id_seq'::regclass);


--
-- Name: tblcompany company_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tblcompany ALTER COLUMN company_id SET DEFAULT nextval('public.tblcompany_company_id_seq'::regclass);


--
-- Name: tblcomponent id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tblcomponent ALTER COLUMN id SET DEFAULT nextval('public.tblcomponent_id_seq'::regclass);


--
-- Name: tblcustomer id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tblcustomer ALTER COLUMN id SET DEFAULT nextval('public.tblcustomer_id_seq'::regclass);


--
-- Name: tblmaterial id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tblmaterial ALTER COLUMN id SET DEFAULT nextval('public.tblmaterial_id_seq'::regclass);


--
-- Name: tblperson id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tblperson ALTER COLUMN id SET DEFAULT nextval('public.tblperson_id_seq'::regclass);


--
-- Name: tblproject id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tblproject ALTER COLUMN id SET DEFAULT nextval('public.tblproject_id_seq'::regclass);


--
-- Name: tbluser id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbluser ALTER COLUMN id SET DEFAULT nextval('public.tbluser_id_seq'::regclass);


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.session (sid, sess, expire) FROM stdin;
b_AQ4fqNSe8DIJM6xP9YfhESC1TBWaq-	{"cookie":{"originalMaxAge":604800000,"expires":"2025-04-08T09:40:03.406Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-04-08 10:33:15
\.


--
-- Data for Name: tblattachment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tblattachment (id, project_id, file_name, file_path, file_type, file_size, description, created_at, original_name) FROM stdin;
\.


--
-- Data for Name: tblcompany; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tblcompany (company_id, project_id, company_art, company_name, street, house_number, address_line_2, postal_code, city, city_part, state, country, company_phone, company_email) FROM stdin;
1	\N	\N	Stadt M	Raumerstrasse	23	\N	39922	X	\N	\N	\N	\N	le@gsl.de
2	\N	\N	fsdd	LSJFL	34	\N	20284	Haals	\N	\N	\N	49128493839	le@gsl.de
\.


--
-- Data for Name: tblcomponent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tblcomponent (id, component_id, project_id, component_name) FROM stdin;
\.


--
-- Data for Name: tblcustomer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tblcustomer (id, project_id, customer_id, street, house_number, address_line_2, postal_code, city, city_part, state, country, geodate, customer_phone, customer_email) FROM stdin;
1	\N	1	Testerstrasse	34	\N	20389	Testing	\N	\N	\N	\N	128493839	le@gsl.de
2	\N	1	Testerstrasse	34	\N	20389	Testing	\N	\N	\N	\N	128493839	le@gsl.de
3	\N	928930	Haupstrasse	23	\N	20248	Hajslf	\N	\N	\N	\N	128493839	lggj@slsl.de
\.


--
-- Data for Name: tblmaterial; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tblmaterial (id, material_id, material_name, material_amount, material_price, material_total) FROM stdin;
\.


--
-- Data for Name: tblperson; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tblperson (id, person_id, project_id, company_id, professional_name, firstname, lastname) FROM stdin;
\.


--
-- Data for Name: tblproject; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tblproject (id, project_id, customer_id, company_id, person_id, permission, permission_name, project_cluster, project_name, project_art, project_width, project_length, project_height, project_text, project_startdate, project_enddate, project_stop, project_stopstartdate, project_stopenddate) FROM stdin;
1	\N	2	1	\N	f		Test	Test	Umbau	234.00	12.00	34.00	\N	\N	\N	f	\N	\N
\.


--
-- Data for Name: tbluser; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tbluser (id, username, password, user_name, user_email) FROM stdin;
1	leazimmer	ae717fd9fed9cf1e8243192081681cf3fdb45e362a4128418083b488979ecd107dd5326f15608cf04885773559875190de097b101a33d5f3a70328ed5bc844ec.a445df5e41edf3cb9523f8c77cfb1916	Zimmer	lea.zimmer@gmx.net
\.


--
-- Name: tblattachment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tblattachment_id_seq', 1, false);


--
-- Name: tblcompany_company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tblcompany_company_id_seq', 2, true);


--
-- Name: tblcomponent_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tblcomponent_id_seq', 1, false);


--
-- Name: tblcustomer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tblcustomer_id_seq', 3, true);


--
-- Name: tblmaterial_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tblmaterial_id_seq', 1, false);


--
-- Name: tblperson_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tblperson_id_seq', 1, false);


--
-- Name: tblproject_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tblproject_id_seq', 1, true);


--
-- Name: tbluser_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tbluser_id_seq', 1, true);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: tblattachment tblattachment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tblattachment
    ADD CONSTRAINT tblattachment_pkey PRIMARY KEY (id);


--
-- Name: tblcompany tblcompany_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tblcompany
    ADD CONSTRAINT tblcompany_pkey PRIMARY KEY (company_id);


--
-- Name: tblcomponent tblcomponent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tblcomponent
    ADD CONSTRAINT tblcomponent_pkey PRIMARY KEY (id);


--
-- Name: tblcustomer tblcustomer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tblcustomer
    ADD CONSTRAINT tblcustomer_pkey PRIMARY KEY (id);


--
-- Name: tblmaterial tblmaterial_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tblmaterial
    ADD CONSTRAINT tblmaterial_pkey PRIMARY KEY (id);


--
-- Name: tblperson tblperson_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tblperson
    ADD CONSTRAINT tblperson_pkey PRIMARY KEY (id);


--
-- Name: tblproject tblproject_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tblproject
    ADD CONSTRAINT tblproject_pkey PRIMARY KEY (id);


--
-- Name: tbluser tbluser_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbluser
    ADD CONSTRAINT tbluser_pkey PRIMARY KEY (id);


--
-- Name: tbluser tbluser_username_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbluser
    ADD CONSTRAINT tbluser_username_unique UNIQUE (username);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: tblattachment tblattachment_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tblattachment
    ADD CONSTRAINT tblattachment_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.tblproject(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

