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
-- Name: analysis_types; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.analysis_types AS ENUM (
    'asphalt',
    'ground'
);


ALTER TYPE public.analysis_types OWNER TO neondb_owner;

--
-- Name: bauphase_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.bauphase_type AS ENUM (
    'Baustart Tiefbau FÖB',
    'Baustart Tiefbau EWB',
    'Tiefbau EWB',
    'Tiefbau FÖB',
    'Montage NE3 EWB',
    'Montage NE3 FÖB',
    'Endmontage NE4 EWB',
    'Endmontage NE4 FÖB',
    'Sonstiges'
);


ALTER TYPE public.bauphase_type OWNER TO neondb_owner;

--
-- Name: belastungsklassen; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.belastungsklassen AS ENUM (
    'Bk100',
    'Bk32',
    'Bk10',
    'Bk3.2',
    'Bk1.8',
    'Bk1.0',
    'Bk0.3',
    'unbekannt'
);


ALTER TYPE public.belastungsklassen OWNER TO neondb_owner;

--
-- Name: bodenklassen; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.bodenklassen AS ENUM (
    'BK1',
    'BK2',
    'BK3',
    'BK4',
    'BK5',
    'BK6',
    'BK7',
    'unbekannt',
    'Kies',
    'Sand',
    'Lehm',
    'Ton',
    'Humus',
    'Fels',
    'Schotter'
);


ALTER TYPE public.bodenklassen OWNER TO neondb_owner;

--
-- Name: bodentragfaehigkeitsklassen; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.bodentragfaehigkeitsklassen AS ENUM (
    'F1',
    'F2',
    'F3',
    'unbekannt'
);


ALTER TYPE public.bodentragfaehigkeitsklassen OWNER TO neondb_owner;

--
-- Name: company_types; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.company_types AS ENUM (
    'Subunternehmen',
    'Generalunternehmen'
);


ALTER TYPE public.company_types OWNER TO neondb_owner;

--
-- Name: ewb_foeb_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.ewb_foeb_type AS ENUM (
    'EWB',
    'FÖB',
    'EWB,FÖB',
    'keine'
);


ALTER TYPE public.ewb_foeb_type OWNER TO neondb_owner;

--
-- Name: file_category_enum; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.file_category_enum AS ENUM (
    'Verträge',
    'Rechnungen',
    'Pläne',
    'Protokolle',
    'Genehmigungen',
    'Fotos',
    'Analysen',
    'Andere'
);


ALTER TYPE public.file_category_enum OWNER TO neondb_owner;

--
-- Name: login_event_types; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.login_event_types AS ENUM (
    'login',
    'logout',
    'register',
    'failed_login'
);


ALTER TYPE public.login_event_types OWNER TO neondb_owner;

--
-- Name: user_roles; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.user_roles AS ENUM (
    'administrator',
    'manager',
    'benutzer'
);


ALTER TYPE public.user_roles OWNER TO neondb_owner;

--
-- Name: verification_types; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.verification_types AS ENUM (
    'login',
    'password_reset'
);


ALTER TYPE public.verification_types OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO neondb_owner;

--
-- Name: tblBedarfKapa; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."tblBedarfKapa" (
    id integer NOT NULL,
    project_id integer,
    "BedarfKapa_name" character varying(100) NOT NULL,
    "BedarfKapa_Anzahl" integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    kalenderwoche integer DEFAULT 0 NOT NULL,
    jahr integer DEFAULT EXTRACT(year FROM CURRENT_DATE) NOT NULL
);


ALTER TABLE public."tblBedarfKapa" OWNER TO neondb_owner;

--
-- Name: tblBedarfKapa_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."tblBedarfKapa_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."tblBedarfKapa_id_seq" OWNER TO neondb_owner;

--
-- Name: tblBedarfKapa_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."tblBedarfKapa_id_seq" OWNED BY public."tblBedarfKapa".id;


--
-- Name: tblattachment; Type: TABLE; Schema: public; Owner: neondb_owner
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
    original_name character varying(255) NOT NULL,
    file_category public.file_category_enum,
    tags character varying(255)
);


ALTER TABLE public.tblattachment OWNER TO neondb_owner;

--
-- Name: tblattachment_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblattachment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblattachment_id_seq OWNER TO neondb_owner;

--
-- Name: tblattachment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblattachment_id_seq OWNED BY public.tblattachment.id;


--
-- Name: tblcompany; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblcompany (
    company_id integer NOT NULL,
    project_id integer,
    company_art public.company_types,
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


ALTER TABLE public.tblcompany OWNER TO neondb_owner;

--
-- Name: tblcompany_company_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblcompany_company_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblcompany_company_id_seq OWNER TO neondb_owner;

--
-- Name: tblcompany_company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblcompany_company_id_seq OWNED BY public.tblcompany.company_id;


--
-- Name: tblcomponent; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblcomponent (
    id integer NOT NULL,
    component_id character varying(1000),
    project_id integer,
    component_name character varying(1000)
);


ALTER TABLE public.tblcomponent OWNER TO neondb_owner;

--
-- Name: tblcomponent_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblcomponent_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblcomponent_id_seq OWNER TO neondb_owner;

--
-- Name: tblcomponent_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblcomponent_id_seq OWNED BY public.tblcomponent.id;


--
-- Name: tblcustomer; Type: TABLE; Schema: public; Owner: neondb_owner
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
    customer_email character varying(255),
    customer_type character varying(50),
    first_name character varying(100),
    last_name character varying(100)
);


ALTER TABLE public.tblcustomer OWNER TO neondb_owner;

--
-- Name: tblcustomer_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblcustomer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblcustomer_id_seq OWNER TO neondb_owner;

--
-- Name: tblcustomer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblcustomer_id_seq OWNED BY public.tblcustomer.id;


--
-- Name: tblfile_organization_suggestion; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblfile_organization_suggestion (
    id integer NOT NULL,
    project_id integer NOT NULL,
    suggested_category public.file_category_enum,
    suggested_tags character varying(255),
    reason text,
    confidence numeric(5,2),
    is_applied boolean DEFAULT false,
    applied_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    file_ids text
);


ALTER TABLE public.tblfile_organization_suggestion OWNER TO neondb_owner;

--
-- Name: tblfile_organization_suggestion_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblfile_organization_suggestion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblfile_organization_suggestion_id_seq OWNER TO neondb_owner;

--
-- Name: tblfile_organization_suggestion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblfile_organization_suggestion_id_seq OWNED BY public.tblfile_organization_suggestion.id;


--
-- Name: tblfile_suggestion_attachment; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblfile_suggestion_attachment (
    suggestion_id integer NOT NULL,
    attachment_id integer NOT NULL
);


ALTER TABLE public.tblfile_suggestion_attachment OWNER TO neondb_owner;

--
-- Name: tbllogin_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tbllogin_logs (
    id integer NOT NULL,
    user_id integer,
    username character varying(255) NOT NULL,
    event_type public.login_event_types NOT NULL,
    ip_address character varying(45),
    user_agent character varying(500),
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    success boolean DEFAULT true,
    fail_reason text
);


ALTER TABLE public.tbllogin_logs OWNER TO neondb_owner;

--
-- Name: tbllogin_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tbllogin_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tbllogin_logs_id_seq OWNER TO neondb_owner;

--
-- Name: tbllogin_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tbllogin_logs_id_seq OWNED BY public.tbllogin_logs.id;


--
-- Name: tblmaterial; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblmaterial (
    id integer NOT NULL,
    material_id character varying(1000),
    material_name integer,
    material_amount double precision,
    material_price double precision,
    material_total double precision
);


ALTER TABLE public.tblmaterial OWNER TO neondb_owner;

--
-- Name: tblmaterial_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblmaterial_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblmaterial_id_seq OWNER TO neondb_owner;

--
-- Name: tblmaterial_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblmaterial_id_seq OWNED BY public.tblmaterial.id;


--
-- Name: tblmilestonedetails; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblmilestonedetails (
    id integer NOT NULL,
    milestone_id integer NOT NULL,
    kalenderwoche integer NOT NULL,
    jahr integer NOT NULL,
    text character varying(255),
    supplementary_info text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ewb_foeb public.ewb_foeb_type DEFAULT 'keine'::public.ewb_foeb_type,
    soll_menge character varying(20)
);


ALTER TABLE public.tblmilestonedetails OWNER TO neondb_owner;

--
-- Name: tblmilestonedetails_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblmilestonedetails_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblmilestonedetails_id_seq OWNER TO neondb_owner;

--
-- Name: tblmilestonedetails_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblmilestonedetails_id_seq OWNED BY public.tblmilestonedetails.id;


--
-- Name: tblmilestones; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblmilestones (
    id integer NOT NULL,
    project_id integer NOT NULL,
    name character varying(255) NOT NULL,
    start_kw integer NOT NULL,
    end_kw integer NOT NULL,
    jahr integer NOT NULL,
    color character varying(50),
    type character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ewb_foeb public.ewb_foeb_type DEFAULT 'keine'::public.ewb_foeb_type,
    soll_menge character varying(20),
    bauphase public.bauphase_type DEFAULT 'Sonstiges'::public.bauphase_type
);


ALTER TABLE public.tblmilestones OWNER TO neondb_owner;

--
-- Name: tblmilestones_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblmilestones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblmilestones_id_seq OWNER TO neondb_owner;

--
-- Name: tblmilestones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblmilestones_id_seq OWNED BY public.tblmilestones.id;


--
-- Name: tblpermissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblpermissions (
    id integer NOT NULL,
    project_id integer NOT NULL,
    permission_type character varying(100) NOT NULL,
    permission_authority character varying(100) NOT NULL,
    permission_date date,
    permission_notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tblpermissions OWNER TO neondb_owner;

--
-- Name: tblpermissions_backup; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblpermissions_backup (
    id integer,
    project_id integer,
    permission_name character varying(100),
    permission_date date,
    created_at timestamp without time zone
);


ALTER TABLE public.tblpermissions_backup OWNER TO neondb_owner;

--
-- Name: tblpermissions_old; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblpermissions_old (
    id integer NOT NULL,
    project_id integer NOT NULL,
    permission_name character varying(100) NOT NULL,
    permission_date date,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tblpermissions_old OWNER TO neondb_owner;

--
-- Name: tblpermissions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblpermissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblpermissions_id_seq OWNER TO neondb_owner;

--
-- Name: tblpermissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblpermissions_id_seq OWNED BY public.tblpermissions_old.id;


--
-- Name: tblpermissions_id_seq1; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblpermissions_id_seq1
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblpermissions_id_seq1 OWNER TO neondb_owner;

--
-- Name: tblpermissions_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblpermissions_id_seq1 OWNED BY public.tblpermissions.id;


--
-- Name: tblperson; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.tblperson OWNER TO neondb_owner;

--
-- Name: tblperson_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblperson_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblperson_id_seq OWNER TO neondb_owner;

--
-- Name: tblperson_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblperson_id_seq OWNED BY public.tblperson.id;


--
-- Name: tblproject; Type: TABLE; Schema: public; Owner: neondb_owner
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
    project_stopenddate date,
    project_notes text,
    customer_contact_id integer,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    permission_date date
);


ALTER TABLE public.tblproject OWNER TO neondb_owner;

--
-- Name: tblproject_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblproject_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblproject_id_seq OWNER TO neondb_owner;

--
-- Name: tblproject_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblproject_id_seq OWNED BY public.tblproject.id;


--
-- Name: tblsoil_reference_data; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblsoil_reference_data (
    id integer NOT NULL,
    bodenklasse public.bodenklassen NOT NULL,
    bezeichnung character varying(255) NOT NULL,
    beschreibung text,
    korngroesse character varying(100),
    durchlaessigkeit character varying(100),
    tragfaehigkeit public.bodentragfaehigkeitsklassen,
    empfohlene_verdichtung character varying(255),
    empfohlene_belastungsklasse public.belastungsklassen,
    eigenschaften text,
    referenzbild_path character varying(1000),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tblsoil_reference_data OWNER TO neondb_owner;

--
-- Name: tblsoil_reference_data_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblsoil_reference_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblsoil_reference_data_id_seq OWNER TO neondb_owner;

--
-- Name: tblsoil_reference_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblsoil_reference_data_id_seq OWNED BY public.tblsoil_reference_data.id;


--
-- Name: tblsurface_analysis; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblsurface_analysis (
    id integer NOT NULL,
    project_id integer,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    location_name character varying(255),
    street character varying(255),
    house_number character varying(10),
    postal_code character varying(10),
    city character varying(100),
    notes text,
    image_file_path character varying(1000) NOT NULL,
    visualization_file_path character varying(1000),
    belastungsklasse public.belastungsklassen NOT NULL,
    asphalttyp character varying(100),
    confidence double precision,
    analyse_details text,
    created_at timestamp without time zone DEFAULT now(),
    bodenklasse public.bodenklassen,
    bodentragfaehigkeitsklasse public.bodentragfaehigkeitsklassen,
    ground_image_file_path character varying(1000),
    ground_confidence double precision,
    ground_analyse_details text,
    analysis_type public.analysis_types DEFAULT 'asphalt'::public.analysis_types
);


ALTER TABLE public.tblsurface_analysis OWNER TO neondb_owner;

--
-- Name: tblsurface_analysis_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblsurface_analysis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblsurface_analysis_id_seq OWNER TO neondb_owner;

--
-- Name: tblsurface_analysis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblsurface_analysis_id_seq OWNED BY public.tblsurface_analysis.id;


--
-- Name: tbluser; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tbluser (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    user_name character varying(100),
    user_email character varying(255),
    role public.user_roles DEFAULT 'benutzer'::public.user_roles,
    created_by integer,
    gdpr_consent boolean DEFAULT false
);


ALTER TABLE public.tbluser OWNER TO neondb_owner;

--
-- Name: tbluser_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tbluser_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tbluser_id_seq OWNER TO neondb_owner;

--
-- Name: tbluser_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tbluser_id_seq OWNED BY public.tbluser.id;


--
-- Name: tblverification_codes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblverification_codes (
    id integer NOT NULL,
    user_id integer,
    code character varying(10) NOT NULL,
    type public.verification_types DEFAULT 'login'::public.verification_types,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone NOT NULL,
    used_at timestamp without time zone,
    is_valid boolean DEFAULT true
);


ALTER TABLE public.tblverification_codes OWNER TO neondb_owner;

--
-- Name: tblverification_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblverification_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblverification_codes_id_seq OWNER TO neondb_owner;

--
-- Name: tblverification_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblverification_codes_id_seq OWNED BY public.tblverification_codes.id;


--
-- Name: tblBedarfKapa id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."tblBedarfKapa" ALTER COLUMN id SET DEFAULT nextval('public."tblBedarfKapa_id_seq"'::regclass);


--
-- Name: tblattachment id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblattachment ALTER COLUMN id SET DEFAULT nextval('public.tblattachment_id_seq'::regclass);


--
-- Name: tblcompany company_id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblcompany ALTER COLUMN company_id SET DEFAULT nextval('public.tblcompany_company_id_seq'::regclass);


--
-- Name: tblcomponent id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblcomponent ALTER COLUMN id SET DEFAULT nextval('public.tblcomponent_id_seq'::regclass);


--
-- Name: tblcustomer id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblcustomer ALTER COLUMN id SET DEFAULT nextval('public.tblcustomer_id_seq'::regclass);


--
-- Name: tblfile_organization_suggestion id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblfile_organization_suggestion ALTER COLUMN id SET DEFAULT nextval('public.tblfile_organization_suggestion_id_seq'::regclass);


--
-- Name: tbllogin_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tbllogin_logs ALTER COLUMN id SET DEFAULT nextval('public.tbllogin_logs_id_seq'::regclass);


--
-- Name: tblmaterial id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblmaterial ALTER COLUMN id SET DEFAULT nextval('public.tblmaterial_id_seq'::regclass);


--
-- Name: tblmilestonedetails id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblmilestonedetails ALTER COLUMN id SET DEFAULT nextval('public.tblmilestonedetails_id_seq'::regclass);


--
-- Name: tblmilestones id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblmilestones ALTER COLUMN id SET DEFAULT nextval('public.tblmilestones_id_seq'::regclass);


--
-- Name: tblpermissions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblpermissions ALTER COLUMN id SET DEFAULT nextval('public.tblpermissions_id_seq1'::regclass);


--
-- Name: tblpermissions_old id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblpermissions_old ALTER COLUMN id SET DEFAULT nextval('public.tblpermissions_id_seq'::regclass);


--
-- Name: tblperson id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblperson ALTER COLUMN id SET DEFAULT nextval('public.tblperson_id_seq'::regclass);


--
-- Name: tblproject id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblproject ALTER COLUMN id SET DEFAULT nextval('public.tblproject_id_seq'::regclass);


--
-- Name: tblsoil_reference_data id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblsoil_reference_data ALTER COLUMN id SET DEFAULT nextval('public.tblsoil_reference_data_id_seq'::regclass);


--
-- Name: tblsurface_analysis id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblsurface_analysis ALTER COLUMN id SET DEFAULT nextval('public.tblsurface_analysis_id_seq'::regclass);


--
-- Name: tbluser id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tbluser ALTER COLUMN id SET DEFAULT nextval('public.tbluser_id_seq'::regclass);


--
-- Name: tblverification_codes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblverification_codes ALTER COLUMN id SET DEFAULT nextval('public.tblverification_codes_id_seq'::regclass);


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session (sid, sess, expire) FROM stdin;
lZ9Sedue6K1ju8cGTefI7SWQxzW0xThx	{"cookie":{"originalMaxAge":604800000,"expires":"2025-04-27T11:27:59.142Z","secure":false,"httpOnly":true,"path":"/"}}	2025-04-27 11:28:00
0jCaci928yDywMEEa-By8ZcJLhQKBIjV	{"cookie":{"originalMaxAge":604800000,"expires":"2025-04-28T09:59:04.960Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-04-28 10:04:18
\.


--
-- Data for Name: tblBedarfKapa; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."tblBedarfKapa" (id, project_id, "BedarfKapa_name", "BedarfKapa_Anzahl", created_at, kalenderwoche, jahr) FROM stdin;
2	2	Endmontage NE3	2	2025-04-18 09:23:24.841438	0	2025
3	2	HSA Tiefbau	1	2025-04-18 09:24:19.874588	0	2025
4	2	Endmontage NE3	3	2025-04-18 09:57:25.371005	6	2025
\.


--
-- Data for Name: tblattachment; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblattachment (id, project_id, file_name, file_path, file_type, file_size, description, created_at, original_name, file_category, tags) FROM stdin;
11	2	IMG_1507 (1) (1).jpg	/home/runner/workspace/uploads/file-1744039459737-244553567.jpg	image	4085944	\N	2025-04-07 15:24:25.047655	IMG_1507 (1) (1).jpg	\N	\N
12	2	IMG_1547.jpg	/home/runner/workspace/uploads/file-1745135393826-535495864.jpg	image	4943911	\N	2025-04-20 07:50:23.030085	IMG_1547.jpg	Fotos	Asphalt
\.


--
-- Data for Name: tblcompany; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblcompany (company_id, project_id, company_art, company_name, street, house_number, address_line_2, postal_code, city, city_part, state, country, company_phone, company_email) FROM stdin;
3	0	Generalunternehmen	Müller GmbH	Haupstraße	19		10115	Berlin			Deutschland	\N	info@mueller.de
4	0	Subunternehmen	Schneider AG	Bahnhofstrasse	97		20095	Hamburg			Deutschland	\N	info@schneider.de
5	0	Subunternehmen	Gerster & Co. KG	Gartenweg	1		80331	München			Deutschland	\N	info@gerster.de
\.


--
-- Data for Name: tblcomponent; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblcomponent (id, component_id, project_id, component_name) FROM stdin;
\.


--
-- Data for Name: tblcustomer; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblcustomer (id, project_id, customer_id, street, house_number, address_line_2, postal_code, city, city_part, state, country, geodate, customer_phone, customer_email, customer_type, first_name, last_name) FROM stdin;
6	\N	1	Lindenstrasse	78	\N	50667	Köln			Deutschland	\N	06736346469	anna.schmidt@schmidt-versicherung.de	Gewerbe	Anna	Schmidt
7	\N	2	Kirchweg	24	\N	70173	Stuttgart			Deutschland	\N	02111261375	lukas.meier@online.de	Privatkunde	Lukas	Meier
\.


--
-- Data for Name: tblfile_organization_suggestion; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblfile_organization_suggestion (id, project_id, suggested_category, suggested_tags, reason, confidence, is_applied, applied_at, created_at, file_ids) FROM stdin;
\.


--
-- Data for Name: tblfile_suggestion_attachment; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblfile_suggestion_attachment (suggestion_id, attachment_id) FROM stdin;
\.


--
-- Data for Name: tbllogin_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tbllogin_logs (id, user_id, username, event_type, ip_address, user_agent, "timestamp", success, fail_reason) FROM stdin;
1	1	leazimmer	logout	10.83.0.143	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-18 17:15:02.021314	t	\N
2	1	leazimmer	login	10.83.2.83	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-18 17:15:08.099154	t	\N
3	1	leazimmer	login	10.83.2.83	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-18 17:15:10.652614	t	\N
4	1	leazimmer	logout	10.83.2.83	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-18 17:22:31.616928	t	\N
5	1	leazimmer	login	10.83.2.83	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-18 17:26:28.259652	t	\N
6	1	leazimmer	logout	10.83.8.24	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-18 17:26:44.527843	t	\N
7	1	leazimmer	login	10.83.2.83	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-18 18:23:35.950277	t	\N
8	1	leazimmer	login	10.83.2.83	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-18 18:23:38.805706	t	\N
9	1	leazimmer	logout	10.83.2.83	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-18 18:23:51.493266	t	\N
10	1	leazimmer	login	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-18 18:24:01.31822	t	\N
11	1	leazimmer	logout	10.83.0.143	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-18 18:28:35.357436	t	\N
12	1	leazimmer	login	10.83.4.3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 06:47:48.970063	t	\N
13	1	leazimmer	login	10.83.4.3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 06:48:27.221213	t	\N
14	1	leazimmer	logout	10.83.2.46	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 07:06:13.986722	t	\N
15	1	leazimmer	login	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 10:42:36.86779	t	\N
16	1	leazimmer	logout	10.83.5.3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 11:28:09.829707	t	\N
17	1	leazimmer	login	10.83.4.3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 11:58:24.111073	t	\N
18	1	leazimmer	logout	10.83.5.3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 12:15:35.081478	t	\N
19	1	leazimmer	login	10.83.4.3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 12:27:56.965687	t	\N
20	1	leazimmer	login	10.83.4.3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 12:28:00.326942	t	\N
21	1	leazimmer	logout	10.83.9.34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 17:47:16.599314	t	\N
22	1	leazimmer	login	10.83.9.34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 17:47:40.294024	t	\N
23	1	leazimmer	logout	10.83.4.3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 19:10:25.749518	t	\N
24	1	leazimmer	login	10.83.9.34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 19:10:33.599682	t	\N
25	1	leazimmer	login	10.83.9.34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 19:10:35.824616	t	\N
26	1	leazimmer	logout	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 05:18:16.514804	t	\N
27	1	leazimmer	login	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 05:25:21.007976	t	\N
28	1	leazimmer	login	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 05:25:23.325743	t	\N
29	1	leazimmer	logout	10.83.3.105	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 05:30:00.132982	t	\N
30	1	leazimmer	login	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 05:50:20.115071	t	\N
31	1	leazimmer	login	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 05:50:23.995804	t	\N
32	1	leazimmer	logout	10.83.7.17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 06:01:19.175319	t	\N
33	1	leazimmer	login	10.83.3.105	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 06:02:21.968778	t	\N
34	1	leazimmer	login	10.83.3.105	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 06:02:29.574699	t	\N
35	1	leazimmer	logout	10.83.9.34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 09:12:35.977995	t	\N
36	1	leazimmer	login	10.83.6.19	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 09:14:48.409953	t	\N
37	1	leazimmer	logout	10.83.9.34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 09:15:15.925103	t	\N
38	4	wolfgang	register	10.83.7.17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 09:17:47.716576	t	\N
39	1	leazimmer	login	10.83.5.17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 09:18:57.136841	t	\N
40	1	leazimmer	logout	10.83.5.17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 11:07:47.358851	t	\N
41	1	leazimmer	login	10.83.7.17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 11:07:59.495641	t	\N
42	1	leazimmer	login	10.83.5.17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 11:13:05.189352	t	\N
43	1	leazimmer	login	10.83.5.17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 11:17:03.522353	t	\N
44	1	leazimmer	login	10.83.5.17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 11:17:35.954107	t	\N
45	1	leazimmer	logout	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 11:17:46.142933	t	\N
46	1	leazimmer	login	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 11:23:21.896205	t	\N
47	1	leazimmer	logout	10.83.6.19	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 11:27:59.431922	t	\N
48	1	leazimmer	login	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 11:28:08.837758	t	\N
49	1	leazimmer	logout	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 11:28:47.397592	t	\N
50	1	leazimmer	login	10.83.6.19	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 11:39:27.042666	t	\N
51	1	leazimmer	logout	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 12:47:19.022032	t	\N
52	1	leazimmer	login	10.83.9.34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 12:47:25.726211	t	\N
53	1	leazimmer	logout	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 13:19:07.528167	t	\N
54	1	leazimmer	login	10.83.7.17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 13:19:15.101923	t	\N
55	1	leazimmer	logout	10.83.6.19	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 15:19:31.494665	t	\N
56	1	leazimmer	login	10.83.7.17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 15:19:41.886516	t	\N
57	1	leazimmer	logout	10.83.7.17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-21 08:29:16.248297	t	\N
58	5	eva	register	10.83.6.19	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-21 08:31:41.478261	t	\N
59	5	eva	logout	10.83.6.19	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-21 08:34:03.489099	t	\N
60	5	eva	login	10.83.5.17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-21 08:48:29.18764	t	\N
61	5	eva	logout	10.83.7.17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-21 09:58:57.990637	t	\N
62	1	leazimmer	login	10.83.3.105	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-21 09:59:05.09253	t	\N
\.


--
-- Data for Name: tblmaterial; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblmaterial (id, material_id, material_name, material_amount, material_price, material_total) FROM stdin;
\.


--
-- Data for Name: tblmilestonedetails; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblmilestonedetails (id, milestone_id, kalenderwoche, jahr, text, supplementary_info, created_at, ewb_foeb, soll_menge) FROM stdin;
1	5	16	2025			2025-04-18 14:44:33.455636+00	keine	134
\.


--
-- Data for Name: tblmilestones; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblmilestones (id, project_id, name, start_kw, end_kw, jahr, color, type, created_at, ewb_foeb, soll_menge, bauphase) FROM stdin;
4	2	NVT039	43	46	2025	#4F46E5	Bauleiter	2025-04-18 13:00:40.493369+00	FÖB	122	Sonstiges
5	3	NVT224	16	17	2025	#4F46E5	Tiefbau	2025-04-18 14:22:02.445767+00	EWB,FÖB	234	Sonstiges
6	2	NVT004	17	18	2025	#4F46E5	NVT Montage	2025-04-20 06:48:49.123235+00	FÖB	232	Baustart Tiefbau EWB
\.


--
-- Data for Name: tblpermissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblpermissions (id, project_id, permission_type, permission_authority, permission_date, permission_notes, created_at) FROM stdin;
\.


--
-- Data for Name: tblpermissions_backup; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblpermissions_backup (id, project_id, permission_name, permission_date, created_at) FROM stdin;
\.


--
-- Data for Name: tblpermissions_old; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblpermissions_old (id, project_id, permission_name, permission_date, created_at) FROM stdin;
\.


--
-- Data for Name: tblperson; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblperson (id, person_id, project_id, company_id, professional_name, firstname, lastname) FROM stdin;
1	\N	\N	3	\N	Hannes	Müller
2	\N	\N	4	\N	Judith	Sauer
3	\N	\N	5	\N	Manfred	Lauter
\.


--
-- Data for Name: tblproject; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblproject (id, project_id, customer_id, company_id, person_id, permission, permission_name, project_cluster, project_name, project_art, project_width, project_length, project_height, project_text, project_startdate, project_enddate, project_stop, project_stopstartdate, project_stopenddate, project_notes, customer_contact_id, created_by, created_at, permission_date) FROM stdin;
2	\N	6	4	1	f			Baustelle Oberbrunn	Tiefbau	\N	\N	\N	\N	2025-04-29	2025-05-07	f	\N	\N	\N	6	1	2025-04-18 14:50:14.370962	\N
3	\N	7	4	2	f		1	Weilheim	Tiefbau	\N	\N	\N	\N	2025-04-15	2025-05-15	f	\N	\N	\N	7	1	2025-04-18 14:50:14.370962	\N
4	\N	6	4	2	f	\N	\N	Projekt Unterhausen	Hochbau	\N	\N	\N	\N	2025-04-01	2026-03-30	f	\N	\N	\N	6	\N	2025-04-20 13:44:44.510117	\N
\.


--
-- Data for Name: tblsoil_reference_data; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblsoil_reference_data (id, bodenklasse, bezeichnung, beschreibung, korngroesse, durchlaessigkeit, tragfaehigkeit, empfohlene_verdichtung, empfohlene_belastungsklasse, eigenschaften, referenzbild_path, created_at) FROM stdin;
8	Kies	Kiesboden	Grobkörniger, gut drainierter Boden mit hoher Tragfähigkeit	2-63 mm	Sehr gut	F3	Vibrationsverdichtung, Schichtstärke 30-50 cm	Bk32	Hohe Scherfestigkeit, gute Tragfähigkeit, frostunempfindlich	\N	2025-04-07 13:48:29.738988
9	Sand	Sandboden	Mittelkörniger Boden mit guter Drainage	0,063-2 mm	Gut	F2	Vibrationsverdichtung, Schichtstärke 20-30 cm	Bk10	Mittlere Scherfestigkeit, frostunempfindlich bei geringem Feinkornanteil	\N	2025-04-07 13:48:29.738988
10	Lehm	Lehmboden	Gemischter Boden aus Sand, Schluff und Ton	0,002-2 mm (gemischt)	Mäßig	F2	Statische Verdichtung, optimaler Wassergehalt wichtig	Bk3.2	Mittlere Plastizität, bedingt frostempfindlich, empfindlich gegen Wassergehaltsschwankungen	\N	2025-04-07 13:48:29.738988
11	Ton	Tonboden	Feinkörniger, bindiger Boden mit geringer Durchlässigkeit	< 0,002 mm	Sehr gering	F1	Stampfverdichtung, dünne Schichten (15-20 cm)	Bk1.8	Hohe Plastizität, quellfähig, stark frostempfindlich	\N	2025-04-07 13:48:29.738988
12	Humus	Humusboden	Organischer Boden mit hohem Humusanteil	Variabel	Variabel	F1	Ungeeignet für direkte Belastung, Austausch empfohlen	Bk0.3	Stark setzungsempfindlich, ungeeignet für Tragschichten, muss ausgetauscht werden	\N	2025-04-07 13:48:29.738988
13	Fels	Felsboden	Anstehender Fels oder Gestein mit sehr hoher Tragfähigkeit	Massiv	Sehr gering (außer bei Klüftung)	F3	Keine Verdichtung erforderlich	Bk100	Höchste Tragfähigkeit, kein Frostproblem, evtl. Sprengung oder hydraulische Methoden erforderlich	\N	2025-04-07 13:48:29.738988
14	Schotter	Schotterboden	Gebrochenes, kantiges Gesteinsmaterial	> 2 mm, meist 32-63 mm	Sehr gut	F3	Vibrationsverdichtung, Schichtstärke 20-30 cm	Bk32	Sehr gute Verschachtelung, hohe Stabilität, hervorragende Tragfähigkeit	\N	2025-04-07 13:48:29.738988
\.


--
-- Data for Name: tblsurface_analysis; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblsurface_analysis (id, project_id, latitude, longitude, location_name, street, house_number, postal_code, city, notes, image_file_path, visualization_file_path, belastungsklasse, asphalttyp, confidence, analyse_details, created_at, bodenklasse, bodentragfaehigkeitsklasse, ground_image_file_path, ground_confidence, ground_analyse_details, analysis_type) FROM stdin;
\.


--
-- Data for Name: tbluser; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tbluser (id, username, password, user_name, user_email, role, created_by, gdpr_consent) FROM stdin;
2	alexandereisenmann	e104b17a646e157f0d3d76db45821ba2133df6a565f38ee733aa241a21c5575e3d4429427dfdcf1a220a653a72a9c928ef7c0e8b47319a48d21653fc3c8884d5.3edb86d4c44c4b2d2bd811112b2cb437	Eisenmann	alexander_eisenmann@t-online.de	benutzer	\N	f
1	leazimmer	ae717fd9fed9cf1e8243192081681cf3fdb45e362a4128418083b488979ecd107dd5326f15608cf04885773559875190de097b101a33d5f3a70328ed5bc844ec.a445df5e41edf3cb9523f8c77cfb1916	Zimmer	lea.zimmer@gmx.net	administrator	\N	f
3	renekuisle	Landau43010#	René Kuisle	Rene.Kuisle@netz-germany.de	benutzer	1	f
4	wolfgang	148e71a9c850a6c1383228e02c1cc9664f2d00fc8558af6ce96d71f8db1a85877d7783f0fde9890a1f96dc0eebaee3f963022bf79fb7a9b45c36761aa2d89cba.f2895b42e90f53c8251e18326d526afc	Wolfgang Zimmer	w.zimmer@hotmail.de	benutzer	\N	t
5	eva	7ef47b76313542ae4013199d0cff9d325f7ebfff82002bfb56ab7b554776f7145754b24ff7fd921c66d8f6dfd34d828f98bf185054e73b3f29b8293719374f82.75dabffaeb6c933778ea6ed31194056d	eva birtel	eva.birtel@web.de	benutzer	\N	t
\.


--
-- Data for Name: tblverification_codes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblverification_codes (id, user_id, code, type, created_at, expires_at, used_at, is_valid) FROM stdin;
1	1	262703	login	2025-04-19 06:18:06.014637	2025-04-19 06:28:05.993	\N	t
2	1	441151	login	2025-04-19 06:35:41.836255	2025-04-19 06:45:41.815	\N	t
3	1	197269	login	2025-04-19 06:37:05.992101	2025-04-19 06:47:05.97	\N	t
5	1	719467	login	2025-04-19 06:47:54.711889	2025-04-19 06:57:54.691	\N	t
4	1	147812	login	2025-04-19 06:43:23.799869	2025-04-19 06:53:23.776	2025-04-19 06:48:27.017	f
6	1	259019	login	2025-04-19 06:48:29.545293	2025-04-19 06:58:29.525	\N	t
7	1	375346	login	2025-04-19 07:06:34.570792	2025-04-19 07:16:34.551	\N	t
8	1	623699	password_reset	2025-04-19 07:07:09.88786	2025-04-19 08:07:09.779	\N	t
9	1	867587	login	2025-04-19 07:07:09.915023	2025-04-19 07:17:09.895	\N	t
10	1	995619	login	2025-04-19 10:23:02.972864	2025-04-19 10:33:02.952	\N	t
11	1	444637	login	2025-04-19 10:36:46.297345	2025-04-19 10:46:46.276	2025-04-19 10:42:36.573	f
12	1	871135	login	2025-04-19 10:42:40.32746	2025-04-19 10:52:40.307	\N	t
13	1	323572	login	2025-04-19 10:42:43.042222	2025-04-19 10:52:43.021	\N	t
15	1	746519	password_reset	2025-04-19 11:57:16.568114	2025-04-19 12:57:14.461	\N	t
14	1	704259	login	2025-04-19 11:57:15.977203	2025-04-19 12:07:15.955	2025-04-19 11:58:23.823	f
16	1	571246	login	2025-04-19 12:15:57.939133	2025-04-19 12:25:57.919	\N	t
17	1	204531	login	2025-04-19 12:16:07.124777	2025-04-19 12:26:07.1	\N	t
18	1	451605	login	2025-04-19 12:16:15.087156	2025-04-19 12:26:15.066	\N	t
19	1	600288	login	2025-04-19 12:16:21.704313	2025-04-19 12:26:21.684	\N	t
\.


--
-- Name: tblBedarfKapa_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."tblBedarfKapa_id_seq"', 4, true);


--
-- Name: tblattachment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblattachment_id_seq', 12, true);


--
-- Name: tblcompany_company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblcompany_company_id_seq', 5, true);


--
-- Name: tblcomponent_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblcomponent_id_seq', 1, false);


--
-- Name: tblcustomer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblcustomer_id_seq', 7, true);


--
-- Name: tblfile_organization_suggestion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblfile_organization_suggestion_id_seq', 1, false);


--
-- Name: tbllogin_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tbllogin_logs_id_seq', 62, true);


--
-- Name: tblmaterial_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblmaterial_id_seq', 1, false);


--
-- Name: tblmilestonedetails_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblmilestonedetails_id_seq', 1, true);


--
-- Name: tblmilestones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblmilestones_id_seq', 6, true);


--
-- Name: tblpermissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblpermissions_id_seq', 1, false);


--
-- Name: tblpermissions_id_seq1; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblpermissions_id_seq1', 1, false);


--
-- Name: tblperson_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblperson_id_seq', 3, true);


--
-- Name: tblproject_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblproject_id_seq', 4, true);


--
-- Name: tblsoil_reference_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblsoil_reference_data_id_seq', 14, true);


--
-- Name: tblsurface_analysis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblsurface_analysis_id_seq', 1, false);


--
-- Name: tbluser_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tbluser_id_seq', 5, true);


--
-- Name: tblverification_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblverification_codes_id_seq', 19, true);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: tblBedarfKapa tblBedarfKapa_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."tblBedarfKapa"
    ADD CONSTRAINT "tblBedarfKapa_pkey" PRIMARY KEY (id);


--
-- Name: tblattachment tblattachment_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblattachment
    ADD CONSTRAINT tblattachment_pkey PRIMARY KEY (id);


--
-- Name: tblcompany tblcompany_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblcompany
    ADD CONSTRAINT tblcompany_pkey PRIMARY KEY (company_id);


--
-- Name: tblcomponent tblcomponent_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblcomponent
    ADD CONSTRAINT tblcomponent_pkey PRIMARY KEY (id);


--
-- Name: tblcustomer tblcustomer_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblcustomer
    ADD CONSTRAINT tblcustomer_pkey PRIMARY KEY (id);


--
-- Name: tblfile_organization_suggestion tblfile_organization_suggestion_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblfile_organization_suggestion
    ADD CONSTRAINT tblfile_organization_suggestion_pkey PRIMARY KEY (id);


--
-- Name: tblfile_suggestion_attachment tblfile_suggestion_attachment_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblfile_suggestion_attachment
    ADD CONSTRAINT tblfile_suggestion_attachment_pkey PRIMARY KEY (suggestion_id, attachment_id);


--
-- Name: tbllogin_logs tbllogin_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tbllogin_logs
    ADD CONSTRAINT tbllogin_logs_pkey PRIMARY KEY (id);


--
-- Name: tblmaterial tblmaterial_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblmaterial
    ADD CONSTRAINT tblmaterial_pkey PRIMARY KEY (id);


--
-- Name: tblmilestonedetails tblmilestonedetails_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblmilestonedetails
    ADD CONSTRAINT tblmilestonedetails_pkey PRIMARY KEY (id);


--
-- Name: tblmilestones tblmilestones_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblmilestones
    ADD CONSTRAINT tblmilestones_pkey PRIMARY KEY (id);


--
-- Name: tblpermissions_old tblpermissions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblpermissions_old
    ADD CONSTRAINT tblpermissions_pkey PRIMARY KEY (id);


--
-- Name: tblpermissions tblpermissions_pkey1; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblpermissions
    ADD CONSTRAINT tblpermissions_pkey1 PRIMARY KEY (id);


--
-- Name: tblperson tblperson_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblperson
    ADD CONSTRAINT tblperson_pkey PRIMARY KEY (id);


--
-- Name: tblproject tblproject_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblproject
    ADD CONSTRAINT tblproject_pkey PRIMARY KEY (id);


--
-- Name: tblsoil_reference_data tblsoil_reference_data_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblsoil_reference_data
    ADD CONSTRAINT tblsoil_reference_data_pkey PRIMARY KEY (id);


--
-- Name: tblsurface_analysis tblsurface_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblsurface_analysis
    ADD CONSTRAINT tblsurface_analysis_pkey PRIMARY KEY (id);


--
-- Name: tbluser tbluser_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tbluser
    ADD CONSTRAINT tbluser_pkey PRIMARY KEY (id);


--
-- Name: tbluser tbluser_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tbluser
    ADD CONSTRAINT tbluser_username_unique UNIQUE (username);


--
-- Name: tblverification_codes tblverification_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblverification_codes
    ADD CONSTRAINT tblverification_codes_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: idx_login_logs_event_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_login_logs_event_type ON public.tbllogin_logs USING btree (event_type);


--
-- Name: idx_login_logs_timestamp; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_login_logs_timestamp ON public.tbllogin_logs USING btree ("timestamp");


--
-- Name: idx_login_logs_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_login_logs_user_id ON public.tbllogin_logs USING btree (user_id);


--
-- Name: idx_milestone_details_milestone; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_milestone_details_milestone ON public.tblmilestonedetails USING btree (milestone_id);


--
-- Name: idx_milestone_project; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_milestone_project ON public.tblmilestones USING btree (project_id);


--
-- Name: idx_verification_codes_code; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_verification_codes_code ON public.tblverification_codes USING btree (code);


--
-- Name: idx_verification_codes_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_verification_codes_user_id ON public.tblverification_codes USING btree (user_id);


--
-- Name: tblBedarfKapa tblBedarfKapa_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."tblBedarfKapa"
    ADD CONSTRAINT "tblBedarfKapa_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.tblproject(id);


--
-- Name: tblattachment tblattachment_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblattachment
    ADD CONSTRAINT tblattachment_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.tblproject(id);


--
-- Name: tblfile_organization_suggestion tblfile_organization_suggestion_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblfile_organization_suggestion
    ADD CONSTRAINT tblfile_organization_suggestion_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.tblproject(id) ON DELETE CASCADE;


--
-- Name: tblfile_suggestion_attachment tblfile_suggestion_attachment_attachment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblfile_suggestion_attachment
    ADD CONSTRAINT tblfile_suggestion_attachment_attachment_id_fkey FOREIGN KEY (attachment_id) REFERENCES public.tblattachment(id) ON DELETE CASCADE;


--
-- Name: tblfile_suggestion_attachment tblfile_suggestion_attachment_suggestion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblfile_suggestion_attachment
    ADD CONSTRAINT tblfile_suggestion_attachment_suggestion_id_fkey FOREIGN KEY (suggestion_id) REFERENCES public.tblfile_organization_suggestion(id) ON DELETE CASCADE;


--
-- Name: tbllogin_logs tbllogin_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tbllogin_logs
    ADD CONSTRAINT tbllogin_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.tbluser(id);


--
-- Name: tblmilestonedetails tblmilestonedetails_milestone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblmilestonedetails
    ADD CONSTRAINT tblmilestonedetails_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES public.tblmilestones(id) ON DELETE CASCADE;


--
-- Name: tblmilestones tblmilestones_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblmilestones
    ADD CONSTRAINT tblmilestones_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.tblproject(id) ON DELETE CASCADE;


--
-- Name: tblpermissions_old tblpermissions_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblpermissions_old
    ADD CONSTRAINT tblpermissions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.tblproject(id) ON DELETE CASCADE;


--
-- Name: tblpermissions tblpermissions_project_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblpermissions
    ADD CONSTRAINT tblpermissions_project_id_fkey1 FOREIGN KEY (project_id) REFERENCES public.tblproject(id) ON DELETE CASCADE;


--
-- Name: tblproject tblproject_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblproject
    ADD CONSTRAINT tblproject_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.tbluser(id);


--
-- Name: tblsurface_analysis tblsurface_analysis_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblsurface_analysis
    ADD CONSTRAINT tblsurface_analysis_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.tblproject(id);


--
-- Name: tbluser tbluser_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tbluser
    ADD CONSTRAINT tbluser_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.tbluser(id);


--
-- Name: tblverification_codes tblverification_codes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblverification_codes
    ADD CONSTRAINT tblverification_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.tbluser(id);


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

