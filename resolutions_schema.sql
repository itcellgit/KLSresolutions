--
-- PostgreSQL database dump
--

\restrict gMtVYalErekBPEUUspgHx3rM27whe6HIZLbbPNrtQzUirF2pUMb0mOMtwTQZ2UE

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-08-30 12:03:44

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 4 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 4942 (class 0 OID 0)
-- Dependencies: 4
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 224 (class 1259 OID 16460)
-- Name: bom_resolutions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bom_resolutions (
    id bigint NOT NULL,
    agenda text NOT NULL,
    resolution text NOT NULL,
    compliance text,
    gc_resolution_id bigint,
    dom date NOT NULL
);


ALTER TABLE public.bom_resolutions OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16448)
-- Name: gc_resolutions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gc_resolutions (
    id bigint NOT NULL,
    agenda text NOT NULL,
    resolution text NOT NULL,
    compliance text,
    institute_id integer NOT NULL,
    dom date NOT NULL
);


ALTER TABLE public.gc_resolutions OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16438)
-- Name: institutes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.institutes (
    id integer NOT NULL,
    name character varying(256) NOT NULL,
    phone bigint
);


ALTER TABLE public.institutes OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16423)
-- Name: member_role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.member_role (
    id bigint NOT NULL,
    member_id integer NOT NULL,
    role_id integer NOT NULL,
    level character varying(5) NOT NULL,
    institute_id integer,
    tenure character varying(128) NOT NULL
);


ALTER TABLE public.member_role OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16406)
-- Name: members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.members (
    id integer NOT NULL,
    name character varying(256) NOT NULL,
    phone bigint NOT NULL,
    address text,
    userid integer NOT NULL
);


ALTER TABLE public.members OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16418)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    role_name character varying(256) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16394)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(256) NOT NULL,
    password character varying(256) NOT NULL,
    usertypeid integer NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16389)
-- Name: usertype; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usertype (
    id integer NOT NULL,
    type character varying(256) NOT NULL
);


ALTER TABLE public.usertype OWNER TO postgres;

--
-- TOC entry 4784 (class 2606 OID 16466)
-- Name: bom_resolutions bom_resolutions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bom_resolutions
    ADD CONSTRAINT bom_resolutions_pkey PRIMARY KEY (id);


--
-- TOC entry 4782 (class 2606 OID 16454)
-- Name: gc_resolutions gc_resolutions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gc_resolutions
    ADD CONSTRAINT gc_resolutions_pkey PRIMARY KEY (id);


--
-- TOC entry 4780 (class 2606 OID 16442)
-- Name: institutes institutes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.institutes
    ADD CONSTRAINT institutes_pkey PRIMARY KEY (id);


--
-- TOC entry 4778 (class 2606 OID 16427)
-- Name: member_role member_role_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_role
    ADD CONSTRAINT member_role_pkey PRIMARY KEY (id);


--
-- TOC entry 4774 (class 2606 OID 16412)
-- Name: members members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_pkey PRIMARY KEY (id);


--
-- TOC entry 4776 (class 2606 OID 16422)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4772 (class 2606 OID 16400)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4770 (class 2606 OID 16393)
-- Name: usertype usertype_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usertype
    ADD CONSTRAINT usertype_pkey PRIMARY KEY (id);


--
-- TOC entry 4791 (class 2606 OID 16467)
-- Name: bom_resolutions fk_bom_resolutions_gc_resolution_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bom_resolutions
    ADD CONSTRAINT fk_bom_resolutions_gc_resolution_id FOREIGN KEY (gc_resolution_id) REFERENCES public.gc_resolutions(id);


--
-- TOC entry 4790 (class 2606 OID 16455)
-- Name: gc_resolutions fk_gcresolution_institute_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gc_resolutions
    ADD CONSTRAINT fk_gcresolution_institute_id FOREIGN KEY (institute_id) REFERENCES public.institutes(id);


--
-- TOC entry 4787 (class 2606 OID 16443)
-- Name: member_role fk_memberrole_instituteid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_role
    ADD CONSTRAINT fk_memberrole_instituteid FOREIGN KEY (institute_id) REFERENCES public.institutes(id) NOT VALID;


--
-- TOC entry 4788 (class 2606 OID 16428)
-- Name: member_role fk_memberrole_membersid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_role
    ADD CONSTRAINT fk_memberrole_membersid FOREIGN KEY (member_id) REFERENCES public.members(id);


--
-- TOC entry 4789 (class 2606 OID 16433)
-- Name: member_role fk_memberrole_roleid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_role
    ADD CONSTRAINT fk_memberrole_roleid FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- TOC entry 4786 (class 2606 OID 16413)
-- Name: members fk_members_userid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT fk_members_userid FOREIGN KEY (userid) REFERENCES public.users(id);


--
-- TOC entry 4785 (class 2606 OID 16401)
-- Name: users fk_users_usertypeid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_usertypeid FOREIGN KEY (usertypeid) REFERENCES public.usertype(id) ON UPDATE CASCADE ON DELETE CASCADE;


-- Completed on 2025-08-30 12:03:44

--
-- PostgreSQL database dump complete
--

\unrestrict gMtVYalErekBPEUUspgHx3rM27whe6HIZLbbPNrtQzUirF2pUMb0mOMtwTQZ2UE

