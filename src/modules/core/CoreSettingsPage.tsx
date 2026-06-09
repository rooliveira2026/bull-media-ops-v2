import { useEffect, useState } from "react";
import { PageHeader } from "../../shared/components/PageHeader";
import type { Client, DataSource, IntegrationConnection, Module, User } from "../../shared/types/core";
import {
  listClients,
  listDataSources,
  listIntegrationConnections,
  listModules,
  listProfiles,
} from "./api/core-repository";

export function CoreSettingsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [connections, setConnections] = useState<IntegrationConnection[]>([]);

  useEffect(() => {
    Promise.all([
      listClients(),
      listProfiles(),
      listModules(),
      listDataSources(),
      listIntegrationConnections(),
    ]).then(([clientsData, usersData, modulesData, sourcesData, connectionsData]) => {
      setClients(clientsData);
      setUsers(usersData);
      setModules(modulesData);
      setDataSources(sourcesData);
      setConnections(connectionsData);
    });
  }, []);

  return (
    <section>
      <PageHeader
        eyebrow="Core Platform"
        title="Configurações"
        description="Schema, tipos e repositories mockáveis da Sprint 1, preparados para conexão futura com Supabase."
        meta="Core Platform · Sprint 1"
      />
      <div className="core-grid">
        <div className="section-card">
          <div className="section-card__header">
            <div><span>Core</span><h2>Clientes</h2></div>
            <p>{clients.length} clientes no contrato V2</p>
          </div>
          <ul className="simple-list">
            {clients.map((client) => (
              <li key={client.id}>
                <strong>{client.name}</strong>
                <span>{client.businessModel} · {client.primaryObjective}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="section-card">
          <div className="section-card__header">
            <div><span>Core</span><h2>Usuários</h2></div>
            <p>{users.length} perfis mockados</p>
          </div>
          <ul className="simple-list">
            {users.map((user) => (
              <li key={user.id}>
                <strong>{user.name}</strong>
                <span>{user.email} · {user.roles.join(", ")}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="section-card">
          <div className="section-card__header">
            <div><span>Platform</span><h2>Módulos</h2></div>
            <p>{modules.length} módulos registrados</p>
          </div>
          <ul className="simple-list">
            {modules.map((module) => (
              <li key={module.id}>
                <strong>{module.name}</strong>
                <span>{module.status} · {module.description}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="section-card">
          <div className="section-card__header">
            <div><span>Integrations</span><h2>Fontes de Dados</h2></div>
            <p>{dataSources.length} fontes planejadas</p>
          </div>
          <ul className="simple-list">
            {dataSources.map((source) => (
              <li key={source.id}>
                <strong>{source.name}</strong>
                <span>{source.category} · {source.status}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="section-card">
          <div className="section-card__header">
            <div><span>Integrations</span><h2>Conexões</h2></div>
            <p>{connections.length} placeholders</p>
          </div>
          <ul className="simple-list">
            {connections.map((connection) => (
              <li key={connection.id}>
                <strong>{connection.dataSourceKey}</strong>
                <span>{connection.status} · nenhuma credencial conectada nesta sprint</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
