# -*- mode: ruby -*-
# vi: set ft=ruby :

class rvm::install {
	package {[
		'curl',
		]: ensure => installed,
	}

	exec { 'install-keyserver':
		cwd => '/root/',
		command => 'gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3',
		creates => '/root/.gnupg/'
	}

	exec { 'download-installer':
		cwd => '/root/',
		command => '/usr/bin/wget -O rails-installer https://get.rvm.io',
		creates => '/root/rails-installer',
		require => Exec['install-keyserver']
	}

	exec { 'make-installer-executable':
		cwd => '/root/',
		command => '/bin/chmod 777 rails-installer',
		require => Exec['download-installer']
	}

	exec { 'install-rvm':
		cwd => '/root/',
		command => 'sudo bash rails-installer stable --rails',
		#creates => '/usr/local/rvm/',
		require => Exec['make-installer-executable']
	}

	#exec { 'install-rvm':
		#cwd => '/root/',
		#command => '/usr/bin/curl -sSL https://get.rvm.io | bash -s stable --rails',
		#require => [
			#Package['curl'],
			#Exec['install-keyserver']
		#]
	#}
}
