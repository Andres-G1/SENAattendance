from locust import HttpUser, task, between


class UsuarioSistema(HttpUser):
    wait_time = between(1, 2)  # Pausa de 1 a 2 segundos entre peticiones

    @task(3)
    def consultar_fichas(self):
        self.client.get("/fichas/")

    @task(3)
    def consultar_carreras(self):
        self.client.get("/carreras/")

    @task(2)
    def consultar_competencias(self):
        self.client.get("/competencias/")

    @task(2)
    def consultar_resultados_aprendizaje(self):
        self.client.get("/resultados-aprendizaje/")

    @task(1)
    def consultar_aprendices(self):
        self.client.get("/usuarios/aprendices")

    @task(1)
    def consultar_fichas_coordinador(self):
        self.client.get("/asistencia/coordinador/fichas")