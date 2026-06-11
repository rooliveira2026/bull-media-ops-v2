import { useEffect, useState } from "react";
import { clientConfigs, objectiveLabels, type ClientConfig, type ClientObjective } from "../../shared/api/client-config";
import { PageHeader } from "../../shared/components/PageHeader";
import type { Client, DataSource, Module, User } from "../../shared/types/core";
import {
  listClients,
  listDataSources,
  listModules,
  listProfiles,
} from "./api/core-repository";

const channelOptions = ["Google Ads", "Meta Ads", "LinkedIn Ads", "GA4", "ClickUp", "Google Sheets legado"];
const objectives = Object.keys(objectiveLabels) as ClientObjective[];

export function CoreSettingsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [configs, setConfigs] = useState<ClientConfig[]>(clientConfigs);

  useEffect(() => {
    Promise.all([
      listClients(),
      listProfiles(),
      listModules(),
      listDataSources(),
    ]).then(([clientsData, usersData, modulesData, sourcesData]) => {
      setClients(clientsData);
      setUsers(usersData);
      setModules(modulesData);
      setDataSources(sourcesData);
    });
  }, []);

  function updateConfig(clientId: string, patch: Partial<ClientConfig>) {
    setConfigs((current) => current.map((config) => config.clientId === clientId ? { ...config, ...patch } : config));
  }

  function toggleChannel(clientId: string, channel: string) {
    const config = configs.find((item) => item.clientId === clientId);
    if (!config) return;
    const activeChannels = config.activeChannels.includes(channel)
      ? config.activeChannels.filter((item) => item !== channel)
      : [...config.activeChannels, channel];
    updateConfig(clientId, { activeChannels });
  }

  return (
    <section>
      <PageHeader
        eyebrow="Core Platform"
        title="Configurações"
        description="Base inicial para configurar objetivos, canais e rotinas por cliente antes da persistência definitiva."
        meta="Configuração"
      />
      <div className="settings-layout">
        <div className="section-card section-card--wide">
          <div className="section-card__header">
            <div><span>Clientes</span><h2>Configuração operacional</h2></div>
            <p>Edição local preparada para persistência futura.</p>
          </div>
          <div className="settings-client-list">
            {clients.map((client) => {
              const config = configs.find((item) => item.clientId === client.id) ?? configs[0];
              return (
                <article className="settings-client" key={client.id}>
                  <div>
                    <strong>{client.name}</strong>
                    <span>{client.businessModel} · {client.primaryObjective}</span>
                  </div>
                  <div className="settings-grid">
                    <label><span>Objetivo</span><select value={config.objective} onChange={(event) => updateConfig(client.id, { objective: event.target.value as ClientObjective })}>{objectives.map((objective) => <option value={objective} key={objective}>{objectiveLabels[objective]}</option>)}</select></label>
                    <label><span>Tipo de cliente</span><input value={config.clientType} onChange={(event) => updateConfig(client.id, { clientType: event.target.value })} /></label>
                    <label><span>Moeda</span><select value={config.currency} onChange={(event) => updateConfig(client.id, { currency: event.target.value as "BRL" | "USD" })}><option value="BRL">BRL</option><option value="USD">USD</option></select></label>
                    <label><span>Responsável</span><input value={config.owner} onChange={(event) => updateConfig(client.id, { owner: event.target.value })} /></label>
                  </div>
                  <div className="channel-toggle-row">
                    {channelOptions.map((channel) => (
                      <label key={channel} className="toggle-pill">
                        <input checked={config.activeChannels.includes(channel)} onChange={() => toggleChannel(client.id, channel)} type="checkbox" />
                        <span>{channel}</span>
                      </label>
                    ))}
                  </div>
                  <div className="channel-toggle-row">
                    <label className="toggle-pill"><input checked={config.generatesReport} onChange={(event) => updateConfig(client.id, { generatesReport: event.target.checked })} type="checkbox" /><span>Gera relatório</span></label>
                    <label className="toggle-pill"><input checked={config.generatesPdm} onChange={(event) => updateConfig(client.id, { generatesPdm: event.target.checked })} type="checkbox" /><span>Gera PDM</span></label>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="section-card">
          <div className="section-card__header">
            <div><span>Equipe</span><h2>Usuários</h2></div>
            <p>{users.length} perfis disponíveis</p>
          </div>
          <ul className="simple-list">
            {users.map((user) => (
              <li key={user.id}><strong>{user.name}</strong><span>{user.email} · {user.roles.join(", ")}</span></li>
            ))}
          </ul>
        </div>

        <div className="section-card">
          <div className="section-card__header">
            <div><span>Plataforma</span><h2>Módulos</h2></div>
            <p>{modules.length} áreas registradas</p>
          </div>
          <ul className="simple-list">
            {modules.map((module) => (
              <li key={module.id}><strong>{module.name}</strong><span>{module.status} · {module.description}</span></li>
            ))}
          </ul>
        </div>

        <div className="section-card">
          <div className="section-card__header">
            <div><span>Dados</span><h2>Fontes preparadas</h2></div>
            <p>{dataSources.length} fontes catalogadas</p>
          </div>
          <ul className="simple-list">
            {dataSources.map((source) => (
              <li key={source.id}><strong>{source.name}</strong><span>{source.category} · {source.status}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
